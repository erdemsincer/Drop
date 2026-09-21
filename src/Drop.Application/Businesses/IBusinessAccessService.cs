namespace Drop.Application.Businesses;

public interface IBusinessAccessService
{
    Task<bool> CanManageBranchAsync(
        Guid userId,
        Guid branchId,
        CancellationToken cancellationToken = default);
}
