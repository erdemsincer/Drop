using Drop.Domain.Common;

namespace Drop.Domain.Media;

/// <summary>
/// An uploaded image (a drop photo), stored in the database. The app shrinks
/// photos before upload, so each one is a few hundred kilobytes at most.
/// </summary>
public sealed class MediaFile : Entity
{
    public const int MaxBytes = 2 * 1024 * 1024;

    private MediaFile()
    {
    }

    public MediaFile(Guid uploadedBy, string contentType, byte[] content, DateTimeOffset now)
    {
        if (content.Length == 0 || content.Length > MaxBytes)
            throw new ArgumentOutOfRangeException(nameof(content));

        UploadedBy = uploadedBy;
        ContentType = contentType;
        Content = content;
        CreatedAt = now;
    }

    public Guid UploadedBy { get; private set; }

    public string ContentType { get; private set; } = null!;

    public byte[] Content { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }
}
