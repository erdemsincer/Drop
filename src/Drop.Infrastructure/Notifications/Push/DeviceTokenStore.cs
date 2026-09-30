using Drop.Application.Notifications.Push;
using Drop.Domain.Notifications;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Notifications.Push;

internal sealed class DeviceTokenStore : IDeviceTokenStore
{
    private readonly DropDbContext _dbContext;

    public DeviceTokenStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task UpsertAsync(Guid userId, string token, string platform, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.DeviceTokens.SingleOrDefaultAsync(x => x.Token == token, cancellationToken);

        if (existing is null)
        {
            _dbContext.DeviceTokens.Add(new DeviceToken(userId, token, platform, now));
        }
        else
        {
            existing.AssignTo(userId, platform, now);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task RemoveAsync(Guid userId, string token, CancellationToken cancellationToken = default) =>
        _dbContext.DeviceTokens
            .Where(x => x.UserId == userId && x.Token == token)
            .ExecuteDeleteAsync(cancellationToken);
}
