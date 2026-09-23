namespace Drop.Application.Features.Drops.GetDropDetail;

public sealed record DropDetailResponse(
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
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int ClaimDurationMinutes);