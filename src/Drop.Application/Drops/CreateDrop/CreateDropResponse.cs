namespace Drop.Application.Drops.CreateDrop;

public sealed record CreateDropResponse(
    Guid Id,
    Guid BranchId,
    string Title,
    int Capacity,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    Domain.Drops.DropStatus Status);
