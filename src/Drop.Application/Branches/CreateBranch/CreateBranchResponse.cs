namespace Drop.Application.Branches.CreateBranch;

public sealed record CreateBranchResponse(
    Guid Id,
    Guid BusinessId,
    string Name,
    double Latitude,
    double Longitude);
