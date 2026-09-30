using Drop.Application.Branches.GetBranches;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BranchListQuery : IBranchListQuery
{
    private readonly DropDbContext _dbContext;

    public BranchListQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<bool> BusinessExistsAsync(
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Businesses.AnyAsync(x => x.Id == businessId, cancellationToken);
    }

    public async Task<IReadOnlyList<BranchListItemResponse>> GetAsync(
        Guid businessId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Branches
            .AsNoTracking()
            .Where(branch => branch.BusinessId == businessId)
            // Open branches first, then alphabetical.
            .OrderBy(branch => branch.ClosedAt != null)
            .ThenBy(branch => branch.Name)
            .Select(branch => new BranchListItemResponse(
                branch.Id,
                branch.Name,
                branch.Location.Latitude,
                branch.Location.Longitude,
                _dbContext.Drops.Count(drop =>
                    drop.BranchId == branch.Id &&
                    drop.Status == DropStatus.Active &&
                    drop.EndsAt > now),
                branch.ClosedAt != null))
            .ToListAsync(cancellationToken);
    }
}
