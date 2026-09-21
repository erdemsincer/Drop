using Drop.Application.Branches;
using Drop.Domain.Branches;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Repositories;

internal sealed class BranchRepository : IBranchRepository
{
    private readonly DropDbContext _dbContext;

    public BranchRepository(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        Branch branch,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.Branches.AddAsync(
            branch,
            cancellationToken);
    }

    public Task<Branch?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Branches
            .FirstOrDefaultAsync(
                x => x.Id == id,
                cancellationToken);
    }
}
