namespace Drop.Application.Branches.UpdateBranch;

/// <summary>Latitude/Longitude are optional: omit both to keep the current location.</summary>
public sealed record UpdateBranchRequest(
    string Name,
    double? Latitude,
    double? Longitude);
