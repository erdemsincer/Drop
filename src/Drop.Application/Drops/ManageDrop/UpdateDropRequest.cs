using Drop.Domain.Drops;

namespace Drop.Application.Drops.ManageDrop;

/// <summary>Duration and claim window are fixed once a drop is live; end it early instead.</summary>
public sealed record UpdateDropRequest(
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    DropCategory? Category = null,
    decimal? OriginalPrice = null,
    decimal? DealPrice = null,
    Guid? PhotoId = null,
    decimal? StartPrice = null);
