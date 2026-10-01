using Drop.Domain.Drops;

namespace Drop.Application.Drops.GetBranchDrops;

/// <summary>
/// Business-side view of a drop. Counts are kept separate on purpose:
/// ActiveClaimCount = reserved and not yet expired, RedeemedCount = actually used.
/// </summary>
public sealed record BusinessDropResponse(
    Guid Id,
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    int ActiveClaimCount,
    int RedeemedCount,
    int RemainingCapacity,
    int DurationMinutes,
    int ClaimDurationMinutes,
    DropStatus Status,
    DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    DropCategory Category,
    decimal? OriginalPrice,
    decimal? DealPrice,
    Guid? PhotoId);
