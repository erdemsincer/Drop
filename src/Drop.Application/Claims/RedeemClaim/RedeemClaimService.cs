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

    public async Task<RedeemClaimResponse> ExecuteAsync(
        Guid claimId,
        RedeemClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        if (claimId == Guid.Empty)
        {
            throw new ArgumentException(
                "Claim id cannot be empty.",
                nameof(claimId));
        }

        if (string.IsNullOrWhiteSpace(request.QrToken))
        {
            throw new ArgumentException(
                "QR token cannot be empty.",
                nameof(request));
        }

        var hash = _tokenGenerator.Hash(request.QrToken);

        var result = await _redemptionStore.RedeemAsync(
            claimId,
            hash,
            _timeProvider.GetUtcNow(),
            cancellationToken);

        return new RedeemClaimResponse(
            result.ClaimId,
            result.DropId,
            result.RedeemedAt);
    }
}
