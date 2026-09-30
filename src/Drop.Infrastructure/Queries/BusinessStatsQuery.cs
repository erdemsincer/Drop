using Drop.Application.Businesses.Stats;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BusinessStatsQuery : IBusinessStatsQuery
{
    private readonly DropDbContext _dbContext;

    public BusinessStatsQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<StatsBranchRow>> GetBranchesAsync(
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Branches
            .AsNoTracking()
            .Where(branch => branch.BusinessId == businessId)
            .OrderBy(branch => branch.Name)
            .Select(branch => new StatsBranchRow(branch.Id, branch.Name))
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountDropsStartedAsync(
        Guid businessId,
        DateTimeOffset since,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Drops
            .Where(drop =>
                drop.StartsAt >= since &&
                drop.Status != DropStatus.Draft &&
                _dbContext.Branches.Any(branch => branch.Id == drop.BranchId && branch.BusinessId == businessId))
            .CountAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StatsClaimRow>> GetClaimsAsync(
        Guid businessId,
        DateTimeOffset since,
        CancellationToken cancellationToken = default)
    {
        return await (
            from claim in _dbContext.Claims
            join drop in _dbContext.Drops on claim.DropId equals drop.Id
            join branch in _dbContext.Branches on drop.BranchId equals branch.Id
            where branch.BusinessId == businessId &&
                  (claim.CreatedAt >= since || claim.RedeemedAt >= since)
            select new StatsClaimRow(
                claim.UserId,
                drop.Id,
                drop.Title,
                branch.Id,
                branch.Name,
                claim.CreatedAt,
                claim.RedeemedAt)
        ).AsNoTracking().ToListAsync(cancellationToken);
    }

    public Task<int> CountPreviousCustomersAsync(
        Guid businessId,
        IReadOnlyCollection<Guid> userIds,
        DateTimeOffset before,
        CancellationToken cancellationToken = default)
    {
        return (
            from claim in _dbContext.Claims
            join drop in _dbContext.Drops on claim.DropId equals drop.Id
            join branch in _dbContext.Branches on drop.BranchId equals branch.Id
            where branch.BusinessId == businessId &&
                  userIds.Contains(claim.UserId) &&
                  claim.RedeemedAt < before
            select claim.UserId
        ).Distinct().CountAsync(cancellationToken);
    }
}
