namespace Drop.Application.Claims;

public interface IClaimStore
{
    Task<CreateClaimResult> TryCreateAsync(
        Guid dropId,
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);

    /// <summary>Cancels the user's own active claim under a row lock.</summary>
    Task WithdrawAsync(
        Guid claimId,
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);

    Task RateAsync(
        Guid claimId,
        Guid userId,
        int stars,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
