namespace Drop.Application.Drops.CreateDrop;

public sealed record CreateDropRequest(
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    int DurationMinutes,
    int ClaimDurationMinutes,
    DateTimeOffset? StartsAt = null);
