using Drop.Domain.Drops;

namespace Drop.Application.Claims.MyClaims;

public sealed record MyClaimResponse(
    Guid ClaimId,
    Guid DropId,
    string DropTitle,
    string BusinessName,
    string BranchName,
    ClaimStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    DateTimeOffset? RedeemedAt,
    DropCategory Category,
    Guid BusinessId,
    decimal? OriginalPrice,
    decimal? DealPrice,
    int? Rating,
    Guid? PhotoId,
    /// <summary>What the customer locked in when catching it.</summary>
    decimal? Price);
