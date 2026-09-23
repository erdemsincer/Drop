using Drop.Domain.Drops;

namespace Drop.Application.Drops.ManageDrop;

public sealed record DropLifecycleResponse(
    Guid Id,
    DropStatus Status,
    DateTimeOffset? EndsAt,
    int ActiveClaimCount,
    int ReleasedClaimCount);
