namespace Drop.Application.Branches.CreateBranch;

public sealed record CreateBranchRequest(
    string Name,
    double Latitude,
    double Longitude);
