using Drop.Domain.Users;

namespace Drop.Application.Authentication;

public interface IVerificationCodeStore
{
    Task<VerificationCode?> GetLatestAsync(
        Guid userId,
        VerificationPurpose purpose,
        CancellationToken cancellationToken = default);

    /// <summary>Retires every open code of the user for that purpose and stores a new one.</summary>
    Task ReplaceAsync(
        VerificationCode code,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hash of the code bound to the user and purpose, so a code is useless
    /// for anyone else and a reset code can't verify an e-mail (or vice versa).
    /// </summary>
    string Hash(Guid userId, VerificationPurpose purpose, string code);

    bool Matches(VerificationCode stored, string code);
}
