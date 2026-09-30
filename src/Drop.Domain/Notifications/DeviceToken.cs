using Drop.Domain.Common;

namespace Drop.Domain.Notifications;

/// <summary>
/// A phone's Expo push token. A token belongs to one device, so when another
/// account signs in on it the token simply moves to that account.
/// </summary>
public sealed class DeviceToken : Entity
{
    public const int MaxTokenLength = 200;

    private DeviceToken()
    {
    }

    public DeviceToken(Guid userId, string token, string platform, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Token cannot be empty.", nameof(token));

        Token = token.Trim();
        CreatedAt = now;
        AssignTo(userId, platform, now);
    }

    public Guid UserId { get; private set; }

    public string Token { get; private set; } = null!;

    public string Platform { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset LastSeenAt { get; private set; }

    public void AssignTo(Guid userId, string platform, DateTimeOffset now)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id cannot be empty.", nameof(userId));

        UserId = userId;
        Platform = string.IsNullOrWhiteSpace(platform) ? "unknown" : platform.Trim().ToLowerInvariant();
        LastSeenAt = now;
    }
}
