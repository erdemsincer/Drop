using System.Threading.Channels;
using Drop.Application.Notifications.Push;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Drop.Infrastructure.Notifications.Push;

/// <summary>In-memory queue of fresh claims. Lost on restart, which is fine for a heads-up.</summary>
internal sealed class ClaimCreatedQueue : IClaimCreatedNotifier
{
    private readonly Channel<Guid> _channel = Channel.CreateBounded<Guid>(
        new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.DropOldest });

    public ChannelReader<Guid> Reader => _channel.Reader;

    public void Enqueue(Guid claimId) => _channel.Writer.TryWrite(claimId);
}

/// <summary>Pushes "someone caught your drop" to every member of the drop's business, so the counter can get ready.</summary>
internal sealed class ClaimCreatedDispatcher : BackgroundService
{
    private readonly ClaimCreatedQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ClaimCreatedDispatcher> _logger;

    public ClaimCreatedDispatcher(
        ClaimCreatedQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<ClaimCreatedDispatcher> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var claimId in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await NotifyAsync(claimId, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Failed to notify the business about claim {ClaimId}", claimId);
            }
        }
    }

    private async Task NotifyAsync(Guid claimId, CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        var sender = scope.ServiceProvider.GetRequiredService<IPushSender>();

        var claim = await (
            from c in dbContext.Claims
            join drop in dbContext.Drops on c.DropId equals drop.Id
            join branch in dbContext.Branches on drop.BranchId equals branch.Id
            where c.Id == claimId
            select new
            {
                c.UserId,
                DropTitle = drop.Title,
                BranchId = branch.Id,
                BranchName = branch.Name,
                branch.BusinessId,
                ClaimMinutes = drop.ClaimDuration,
            }
        ).AsNoTracking().SingleOrDefaultAsync(cancellationToken);

        if (claim is null)
        {
            return;
        }

        // Everyone on the team, except a member who caught their own drop while testing.
        var tokens = await (
            from member in dbContext.BusinessMembers
            join device in dbContext.DeviceTokens on member.UserId equals device.UserId
            where member.BusinessId == claim.BusinessId && member.UserId != claim.UserId
            select device.Token
        ).Distinct().ToListAsync(cancellationToken);

        if (tokens.Count == 0)
        {
            return;
        }

        var data = new Dictionary<string, string> { ["branchId"] = claim.BranchId.ToString() };
        var messages = tokens
            .Select(token => new PushMessage(
                token,
                "Biri Drop'unu yakaladı! 🎉",
                $"{claim.DropTitle} · {(int)claim.ClaimMinutes.TotalMinutes} dk içinde {claim.BranchName} şubesine gelecek",
                data))
            .ToList();

        var results = await sender.SendAsync(messages, cancellationToken);

        var gone = results.Where(result => result.DeviceGone).Select(result => result.To).ToList();
        if (gone.Count > 0)
        {
            await dbContext.DeviceTokens.Where(x => gone.Contains(x.Token)).ExecuteDeleteAsync(cancellationToken);
        }
    }
}
