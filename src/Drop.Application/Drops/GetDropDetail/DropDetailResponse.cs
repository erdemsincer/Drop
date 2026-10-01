namespace Drop.Application.Features.Drops.GetDropDetail;

public sealed record DropDetailResponse(
    Guid Id,
    Guid BranchId,
    Guid BusinessId,
    string BusinessName,
    string BranchName,
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    int ClaimedCount,
    int RemainingCapacity,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int ClaimDurationMinutes,
    double Latitude,
    double Longitude,
    string Category,
    decimal? OriginalPrice,
    decimal? DealPrice,
    /// <summary>Average stars across the business's used drops (one decimal); null until rated.</summary>
    double? BusinessRating,
    int BusinessRatingCount,
    Guid? PhotoId);