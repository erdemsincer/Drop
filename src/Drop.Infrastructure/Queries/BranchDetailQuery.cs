using Drop.Application.Branches.GetBranch;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BranchDetailQuery : IBranchDetailQuery
{
    private readonly DropDbContext _dbContext;

    public BranchDetailQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BranchDetailData?> GetAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from branch in _dbContext.Branches
            join business in _dbContext.Businesses
                on branch.BusinessId equals business.Id
            where branch.Id == branchId
            select new BranchDetailData(
                branch.Id,
                branch.Name,
                business.Id,
                business.Name,
                branch.Location.Latitude,
                branch.Location.Longitude,
                business.Status)
        ).AsNoTracking().FirstOrDefaultAsync(cancellationToken);
    }
}
