namespace Drop.Application.Drops.GetBranchDrops;

public interface IBranchDropsQuery
{
    Task<bool> BranchExistsAsync(
        Guid branchId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BusinessDropResponse>> GetAsync(
        Guid branchId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
