using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.GetMyBusinesses;

public sealed record MyBusinessResponse(
    Guid Id,
    string Name,
    BusinessMemberRole Role,
    int BranchCount,
    BusinessStatus Status,
    string? StatusReason);
