namespace Drop.Application.Claims.RedeemClaim;

public sealed record RedeemClaimResponse(
    Guid ClaimId,
    Guid DropId,
    DateTimeOffset RedeemedAt);
