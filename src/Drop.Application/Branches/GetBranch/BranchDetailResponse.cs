using Drop.Domain.Businesses;

namespace Drop.Application.Branches.GetBranch;

public sealed record BranchDetailResponse(
    Guid Id,
    string Name,
    Guid BusinessId,
    string BusinessName,
    double Latitude,
    double Longitude,
    BusinessMemberRole Role,
    bool CanManage,
    bool CanShowQr,
    BusinessStatus BusinessStatus,
    bool IsClosed,
    bool CanPublishDrops);
