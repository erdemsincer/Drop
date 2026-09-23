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

    public Task<bool> ExistsAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Businesses.AnyAsync(
            x => x.Id == id,
            cancellationToken);
    }
}
