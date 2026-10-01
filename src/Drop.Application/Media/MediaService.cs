using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Media;

namespace Drop.Application.Media;

public interface IMediaStore
{
    void Add(MediaFile file);

    Task<MediaFile?> GetAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed record UploadMediaResponse(Guid Id);

public sealed class MediaService
{
    private readonly IMediaStore _store;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public MediaService(
        IMediaStore store,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _store = store;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    /// <summary>Stores a JPEG, PNG or WebP image. The type is read from the bytes, not trusted from the client.</summary>
    public async Task<UploadMediaResponse> UploadAsync(byte[] content, CancellationToken cancellationToken = default)
    {
        if (content.Length == 0 || content.Length > MediaFile.MaxBytes)
        {
            throw new ConflictException("media.too_large", "The image must be smaller than 2 MB.");
        }

        var contentType = Sniff(content)
            ?? throw new ConflictException("media.unsupported", "Only JPEG, PNG and WebP images are accepted.");

        var file = new MediaFile(_currentUser.Id, contentType, content, _timeProvider.GetUtcNow());
        _store.Add(file);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UploadMediaResponse(file.Id);
    }

    public Task<MediaFile?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        _store.GetAsync(id, cancellationToken);

    private static string? Sniff(byte[] bytes) => bytes switch
    {
        [0xFF, 0xD8, 0xFF, ..] => "image/jpeg",
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ..] => "image/png",
        [0x52, 0x49, 0x46, 0x46, _, _, _, _, 0x57, 0x45, 0x42, 0x50, ..] => "image/webp",
        _ => null,
    };
}
