using System.Threading.Channels;
using Drop.Application.Notifications.Push;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Drop.Infrastructure.Notifications.Push;

/// <summary>In-memory queue of drops that just went live. Lost on restart, which is fine for a nudge.</summary>
internal sealed class DropLiveQueue : IDropLiveNotifier
{
    private readonly Channel<Guid> _channel = Channel.CreateBounded<Guid>(
        new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.DropOldest });

    public ChannelReader<Guid> Reader => _channel.Reader;

    public void Enqueue(Guid dropId) => _channel.Writer.TryWrite(dropId);
}

/// <summary>Sends "new drop" pushes to the followers of the drop's business.</summary>
internal sealed class DropLiveDispatcher : BackgroundService
{
    private readonly DropLiveQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<DropLiveDispatcher> _logger;

    public DropLiveDispatcher(
        DropLiveQueue queue,
        IServiceScopeFactory scopeFactory,
        TimeProvider timeProvider,
        ILogger<DropLiveDispatcher> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var dropId in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await NotifyAsync(dropId, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Failed to notify followers of drop {DropId}", dropId);
            }
        }
    }

    private async Task NotifyAsync(Guid dropId, CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        var sender = scope.ServiceProvider.GetRequiredService<IPushSender>();
        var now = _timeProvider.GetUtcNow();

        var drop = await (
            from d in dbContext.Drops
            join branch in dbContext.Branches on d.BranchId equals branch.Id
            join business in dbContext.Businesses on branch.BusinessId equals business.Id
            where d.Id == dropId
            select new { d.Id, d.Title, d.Status, d.EndsAt, BusinessId = business.Id, BusinessName = business.Name, BranchName = branch.Name }
        ).AsNoTracking().SingleOrDefaultAsync(cancellationToken);

        // Cancelled or over before we got to it: nothing worth announcing.
        if (drop is null || drop.Status != DropStatus.Active || drop.EndsAt <= now)
        {
            return;
        }

        var tokens = await (
            from follow in dbContext.BusinessFollows
            join device in dbContext.DeviceTokens on follow.UserId equals device.UserId
            where follow.BusinessId == drop.BusinessId
            select device.Token
        ).Distinct().ToListAsync(cancellationToken);

        if (tokens.Count == 0)
        {
            return;
        }

        var data = new Dictionary<string, string> { ["dropId"] = drop.Id.ToString() };
        var messages = tokens
            .Select(token => new PushMessage(
                token,
                $"{drop.BusinessName} yeni bir Drop yayınladı ⚡",
                $"{drop.Title} · {drop.BranchName}",
                data))
            .ToList();

        var results = await sender.SendAsync(messages, cancellationToken);

        var gone = results.Where(result => result.DeviceGone).Select(result => result.To).ToList();
        if (gone.Count > 0)
        {
            await dbContext.DeviceTokens.Where(x => gone.Contains(x.Token)).ExecuteDeleteAsync(cancellationToken);
        }

        _logger.LogInformation(
            "Drop {DropId}: notified {Count} device(s), removed {Gone} dead token(s)",
            drop.Id, messages.Count, gone.Count);
    }
}
