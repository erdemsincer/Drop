namespace Drop.Application.Drops.GetNearbyDrops;

public sealed record NearbyDropResponse(
    Guid Id,
    Guid BranchId,
    string BusinessName,
    string BranchName,
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    int ClaimedCount,
    int RemainingCapacity,
    int DistanceMeters,
    DateTimeOffset EndsAt,
    string Category,
    double Latitude,
    double Longitude,
    decimal? OriginalPrice,
    decimal? DealPrice,
    /// <summary>Average stars across the business's used drops (one decimal); null until rated.</summary>
    double? BusinessRating,
    int BusinessRatingCount,
    Guid? PhotoId,
    bool IsMystery,
    string? Hint,
    /// <summary>A mystery drop seen from too far: the deal is hidden (see MysteryMask).</summary>
    bool IsLocked,
    /// <summary>Falling-price drops: opening price; the current one follows from StartsAt/EndsAt.</summary>
    decimal? StartPrice,
    DateTimeOffset StartsAt);
