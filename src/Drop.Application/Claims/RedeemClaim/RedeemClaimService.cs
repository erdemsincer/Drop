using Drop.Application.Security;

namespace Drop.Application.Claims.RedeemClaim;

public sealed class RedeemClaimService
{
    private readonly IRedemptionStore _redemptionStore;
    private readonly IQrTokenGenerator _tokenGenerator;
    private readonly TimeProvider _timeProvider;

    public RedeemClaimService(
        IRedemptionStore redemptionStore,
        IQrTokenGenerator tokenGenerator,
        TimeProvider timeProvider)
    {
        _redemptionStore = redemptionStore;
        _tokenGenerator = tokenGenerator;
        _timeProvider = timeProvider;
    }

    public Task<RedeemClaimResponse> ExecuteAsync(
        Guid claimId,
        Guid userId,
        RedeemClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        // Raw token never leaves this method; only its SHA-256 hash reaches the store.
        var tokenHash = _tokenGenerator.Hash(request.QrToken);

        return _redemptionStore.RedeemAsync(
            claimId,
            userId,
            tokenHash,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
