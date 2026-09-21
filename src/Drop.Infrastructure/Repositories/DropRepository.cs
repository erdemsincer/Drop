using Drop.Application.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Repositories;

internal sealed class DropRepository : IDropRepository
{
    private readonly DropDbContext _dbContext;

    public DropRepository(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        Domain.Drops.Drop drop,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.Drops.AddAsync(
            drop,
            cancellationToken);
    }

    public Task<Domain.Drops.Drop?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Drops
            .FirstOrDefaultAsync(
                x => x.Id == id,
                cancellationToken);
    }
}
