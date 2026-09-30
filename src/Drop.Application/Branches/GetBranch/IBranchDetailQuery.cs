namespace Drop.Application.Branches.GetBranch;

public sealed record BranchDetailData(
    Guid Id,
    string Name,
    Guid BusinessId,
    string BusinessName,
    double Latitude,
    double Longitude,
    Drop.Domain.Businesses.BusinessStatus BusinessStatus,
    bool IsClosed);

public interface IBranchDetailQuery
{
    Task<BranchDetailData?> GetAsync(
        Guid branchId,
        CancellationToken cancellationToken = default);
}
