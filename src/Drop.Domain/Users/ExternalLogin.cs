using Drop.Domain.Common;

namespace Drop.Domain.Users;

public enum ExternalProvider
{
    Apple,
    Google,
}

/// <summary>
/// Ties an Apple or Google account (its stable subject id) to a Drop user.
/// A user can have one of each, next to or instead of a password.
/// </summary>
public sealed class ExternalLogin : Entity
{
    public const int MaxSubjectLength = 255;

    private ExternalLogin()
    {
    }

    public ExternalLogin(Guid userId, ExternalProvider provider, string subject, DateTimeOffset now)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id cannot be empty.", nameof(userId));

        if (string.IsNullOrWhiteSpace(subject))
            throw new ArgumentException("Subject cannot be empty.", nameof(subject));

        UserId = userId;
        Provider = provider;
        Subject = subject.Trim();
        CreatedAt = now;
    }

    public Guid UserId { get; private set; }

    public ExternalProvider Provider { get; private set; }

    public string Subject { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }
}
