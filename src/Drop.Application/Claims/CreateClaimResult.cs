namespace Drop.Application.Claims;

public sealed record CreateClaimResult(
    Guid ClaimId,
    Guid DropId,
    DateTimeOffset ExpiresAt,
    int RemainingCapacity);
