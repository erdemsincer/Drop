using Drop.Domain.Common;

namespace Drop.Domain.Users;

/// <summary>
/// Long-lived credential used to obtain new access tokens. Only its hash is stored.
/// Rotated on every use: the old token is revoked and points to its replacement.
/// </summary>
public sealed class RefreshToken : Entity
{
    private RefreshToken()
    {
    }

    public RefreshToken(
        Guid userId,
        string tokenHash,
        DateTimeOffset createdAt,
        TimeSpan lifetime)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id cannot be empty.", nameof(userId));

        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new ArgumentException("Token hash cannot be empty.", nameof(tokenHash));

        UserId = userId;
        TokenHash = tokenHash;
        CreatedAt = createdAt;
        ExpiresAt = createdAt.Add(lifetime);
    }

    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? RevokedAt { get; private set; }

    public Guid? ReplacedByTokenId { get; private set; }
}
