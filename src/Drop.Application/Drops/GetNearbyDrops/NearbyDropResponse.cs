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
    DateTimeOffset EndsAt);
