namespace Drop.Application.Branches.GetBranches;

public sealed record BranchListItemResponse(
    Guid Id,
    string Name,
    double Latitude,
    double Longitude,
    int ActiveDropCount);
