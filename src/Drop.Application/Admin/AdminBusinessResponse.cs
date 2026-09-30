using Drop.Domain.Businesses;

namespace Drop.Application.Admin;

public sealed record AdminBusinessResponse(
    Guid Id,
    string Name,
    BusinessStatus Status,
    string? StatusReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset StatusChangedAt,
    string? OwnerName,
    string? OwnerEmail,
    bool OwnerEmailVerified,
    int BranchCount);
