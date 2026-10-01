namespace Drop.Application.Claims.CreateClaim;

public sealed record CreateClaimResponse(
    Guid ClaimId,
    Guid DropId,
    DateTimeOffset ExpiresAt,
    int RemainingCapacity,
    /// <summary>The price locked in now; for falling-price drops it won't move any more.</summary>
    decimal? Price);
