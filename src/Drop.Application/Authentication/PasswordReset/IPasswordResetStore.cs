using Drop.Domain.Users;

namespace Drop.Application.Authentication.PasswordReset;

public interface IPasswordResetStore
{
    Task<PasswordResetCode?> GetLatestAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>Retires every open code of the user and stores a new one.</summary>
    Task ReplaceAsync(
        PasswordResetCode code,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);

    /// <summary>Hash of the code bound to the user, so a code is useless for anyone else.</summary>
    string Hash(Guid userId, string code);

    bool Matches(PasswordResetCode stored, Guid userId, string code);
}
