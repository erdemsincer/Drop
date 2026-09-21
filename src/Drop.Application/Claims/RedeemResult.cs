namespace Drop.Application.Claims;

public sealed record RedeemResult(
    Guid ClaimId,
    Guid DropId,
    DateTimeOffset RedeemedAt);
