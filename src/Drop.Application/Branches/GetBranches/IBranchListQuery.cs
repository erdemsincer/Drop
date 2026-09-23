namespace Drop.Application.Branches.GetBranches;

public interface IBranchListQuery
{
    Task<bool> BusinessExistsAsync(
        Guid businessId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BranchListItemResponse>> GetAsync(
        Guid businessId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
