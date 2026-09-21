namespace Drop.Application.Claims.CreateClaim;

public sealed record CreateClaimResponse(
    Guid ClaimId,
    Guid DropId,
    DateTimeOffset ExpiresAt,
    int RemainingCapacity);
