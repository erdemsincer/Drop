using Drop.Domain.Common;

namespace Drop.Domain.Users;

public enum VerificationPurpose
{
    PasswordReset = 1,
    EmailVerification = 2
}

/// <summary>
/// One-time code e-mailed to prove access to the inbox (password reset or
/// e-mail verification). Only its hash is stored, and it dies after a few
/// wrong guesses so six digits can't be brute-forced.
/// </summary>
public sealed class VerificationCode : Entity
{
    public const int MaxAttempts = 5;

    private VerificationCode()
    {
    }

    public VerificationCode(
        Guid userId,
        VerificationPurpose purpose,
        string codeHash,
        DateTimeOffset createdAt,
        TimeSpan lifetime)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id cannot be empty.", nameof(userId));

        if (string.IsNullOrWhiteSpace(codeHash))
            throw new ArgumentException("Code hash cannot be empty.", nameof(codeHash));

        UserId = userId;
        Purpose = purpose;
        CodeHash = codeHash;
        CreatedAt = createdAt;
        ExpiresAt = createdAt.Add(lifetime);
    }

    public Guid UserId { get; private set; }

    public VerificationPurpose Purpose { get; private set; }

    public string CodeHash { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public int Attempts { get; private set; }

    public DateTimeOffset? UsedAt { get; private set; }

    public bool IsUsable(DateTimeOffset now) =>
        UsedAt is null && Attempts < MaxAttempts && ExpiresAt > now;

    public void RegisterFailedAttempt() => Attempts++;

    public void MarkUsed(DateTimeOffset now) => UsedAt = now;
}
