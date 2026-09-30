using Drop.Application.Branches.BranchLifecycle;
using Drop.Domain.Branches;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Branches;

internal sealed class BranchLifecycleStore : IBranchLifecycleStore
{
    private readonly DropDbContext _dbContext;

    public BranchLifecycleStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SaveClosedAsync(
        Branch branch,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dropIds = _dbContext.Drops
            .Where(drop =>
                drop.BranchId == branch.Id &&
                (drop.Status == DropStatus.Active || drop.Status == DropStatus.Scheduled))
            .Select(drop => drop.Id);

        // Claims first: once the drops are cancelled the subquery no longer finds them.
        await _dbContext.Claims
            .Where(claim => claim.Status == ClaimStatus.Active && dropIds.Contains(claim.DropId))
            .ExecuteUpdateAsync(s => s.SetProperty(claim => claim.Status, ClaimStatus.Cancelled), cancellationToken);

        await _dbContext.Drops
            .Where(drop => dropIds.Contains(drop.Id))
            .ExecuteUpdateAsync(s => s.SetProperty(drop => drop.Status, DropStatus.Cancelled), cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }
}
