namespace Drop.Application.Branches.GetBranch;

public sealed record BranchDetailData(
    Guid Id,
    string Name,
    Guid BusinessId,
    string BusinessName,
    double Latitude,
    double Longitude);

public interface IBranchDetailQuery
{
    Task<BranchDetailData?> GetAsync(
        Guid branchId,
        CancellationToken cancellationToken = default);
}
