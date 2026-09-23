using Drop.Application.Claims.RedeemClaim;

namespace Drop.Application.Claims;

public interface IRedemptionStore
{
    Task<RedeemClaimResponse> RedeemAsync(
        Guid claimId,
        Guid userId,
        string qrTokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
