using Drop.Application.Follows;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Drop.Infrastructure.Follows;

internal sealed class FollowStore : IFollowStore
{
    private readonly DropDbContext _dbContext;

    public FollowStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<bool> BusinessExistsAsync(Guid businessId, CancellationToken cancellationToken = default) =>
        _dbContext.Businesses.AnyAsync(x => x.Id == businessId, cancellationToken);

    public async Task FollowAsync(Guid userId, Guid businessId, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        if (await _dbContext.BusinessFollows.AnyAsync(x => x.UserId == userId && x.BusinessId == businessId, cancellationToken))
        {
            return;
        }

        _dbContext.BusinessFollows.Add(new BusinessFollow(userId, businessId, now));

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // A double tap raced us; the follow exists, which is all we wanted.
        }
    }

    public Task UnfollowAsync(Guid userId, Guid businessId, CancellationToken cancellationToken = default) =>
        _dbContext.BusinessFollows
            .Where(x => x.UserId == userId && x.BusinessId == businessId)
            .ExecuteDeleteAsync(cancellationToken);

    public async Task<IReadOnlyList<FollowedBusinessResponse>> ListAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await (
            from follow in _dbContext.BusinessFollows
            join business in _dbContext.Businesses on follow.BusinessId equals business.Id
            where follow.UserId == userId
            orderby follow.CreatedAt descending
            select new FollowedBusinessResponse(business.Id, business.Name, follow.CreatedAt)
        ).AsNoTracking().ToListAsync(cancellationToken);
    }
}
