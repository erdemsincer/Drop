using Drop.Domain.Drops;

namespace Drop.Application.Drops.CreateDrop;

public sealed record CreateDropRequest(
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    int DurationMinutes,
    int ClaimDurationMinutes,
    DateTimeOffset? StartsAt = null,
    DropCategory? Category = null,
    decimal? OriginalPrice = null,
    decimal? DealPrice = null,
    Guid? PhotoId = null,
    decimal? StartPrice = null,
    bool IsMystery = false,
    string? Hint = null);
