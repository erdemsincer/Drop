using Drop.Domain.Common;

namespace Drop.Domain.Users;

public sealed class User : Entity
{
    private User()
    {
    }

    public User(
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        DateTimeOffset createdAt)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new ArgumentException("Password hash cannot be empty.");
        }

        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        SetName(firstName, lastName);
        CreatedAt = createdAt;
        Status = UserStatus.Active;
    }

    /// <summary>
    /// A user who signed up with Apple or Google: no password (they can set one
    /// later), and the provider already proved the e-mail address.
    /// </summary>
    public static User CreateExternal(
        string email,
        string firstName,
        string lastName,
        DateTimeOffset createdAt)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email cannot be empty.");
        }

        var user = new User
        {
            Email = email.Trim().ToLowerInvariant(),
            CreatedAt = createdAt,
            Status = UserStatus.Active,
            EmailVerifiedAt = createdAt,
        };
        user.SetName(firstName, lastName);

        return user;
    }

    public string Email { get; private set; } = null!;

    /// <summary>Null for accounts created through Apple or Google that never set a password.</summary>
    public string? PasswordHash { get; private set; }

    public bool HasPassword => PasswordHash is not null;

    public string FirstName { get; private set; } = null!;

    public string LastName { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public UserStatus Status { get; private set; }

    /// <summary>When the user proved they own <see cref="Email"/>; null until then.</summary>
    public DateTimeOffset? EmailVerifiedAt { get; private set; }

    public bool IsEmailVerified => EmailVerifiedAt is not null;

    public void MarkEmailVerified(DateTimeOffset now) => EmailVerifiedAt ??= now;

    public void Rename(string firstName, string lastName) => SetName(firstName, lastName);

    public void ChangePassword(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new ArgumentException("Password hash cannot be empty.");
        }

        PasswordHash = passwordHash;
    }

    private void SetName(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
        {
            throw new ArgumentException("First and last name cannot be empty.");
        }

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
    }
}
