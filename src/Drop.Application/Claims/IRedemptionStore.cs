namespace Drop.Application.Claims;

public interface IRedemptionStore
{
    Task<RedeemResult> RedeemAsync(
        Guid claimId,
        string qrTokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
