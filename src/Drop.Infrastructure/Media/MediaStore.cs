using Drop.Application.Media;
using Drop.Domain.Media;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Media;

internal sealed class MediaStore : IMediaStore
{
    private readonly DropDbContext _dbContext;

    public MediaStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public void Add(MediaFile file) => _dbContext.MediaFiles.Add(file);

    public Task<MediaFile?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.MediaFiles.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.MediaFiles.AnyAsync(x => x.Id == id, cancellationToken);
}
