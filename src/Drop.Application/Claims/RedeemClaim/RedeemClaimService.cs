namespace Drop.Application.Claims.RedeemClaim;

public sealed class RedeemClaimService
{
    private readonly IRedemptionStore _redemptionStore;
    private readonly TimeProvider _timeProvider;

    public RedeemClaimService(
        IRedemptionStore redemptionStore,
        TimeProvider timeProvider)
    {
        _redemptionStore = redemptionStore;
        _timeProvider = timeProvider;
    }

    public Task<RedeemClaimResponse> ExecuteAsync(
        Guid claimId,
        Guid userId,
        RedeemClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        // The scanned payload is a short-lived secret: it is verified, never logged or stored.
        return _redemptionStore.RedeemAsync(
            claimId,
            userId,
            request.QrToken,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
