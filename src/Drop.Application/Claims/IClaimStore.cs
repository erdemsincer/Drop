namespace Drop.Application.Claims;

public interface IClaimStore
{
    /// <param name="latitude">Where the customer is; required to catch a mystery drop.</param>
    Task<CreateClaimResult> TryCreateAsync(
        Guid dropId,
        Guid userId,
        DateTimeOffset now,
        double? latitude,
        double? longitude,
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
