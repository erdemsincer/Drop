using Drop.Application.Businesses;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Repositories;

internal sealed class BusinessRepository : IBusinessRepository
{
    private readonly DropDbContext _dbContext;

    public BusinessRepository(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        Business business,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.Businesses.AddAsync(
            business,
            cancellationToken);
    }

    public Task<Business?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Businesses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<Business?> GetByBranchIdAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        return (
            from branch in _dbContext.Branches
            join business in _dbContext.Businesses on branch.BusinessId equals business.Id
            where branch.Id == branchId
            select business
        ).FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Businesses.AnyAsync(
            x => x.Id == id,
            cancellationToken);
    }
}
