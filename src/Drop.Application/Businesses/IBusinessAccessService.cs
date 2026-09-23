using Drop.Domain.Businesses;

namespace Drop.Application.Businesses;

public interface IBusinessAccessService
{
    /// <summary>Returns the user's role in the business, or null when not a member.</summary>
    Task<BusinessMemberRole?> GetBusinessRoleAsync(
        Guid userId,
        Guid businessId,
        CancellationToken cancellationToken = default);

    /// <summary>Returns the user's role in the branch's business, or null when not a member.</summary>
    Task<BusinessMemberRole?> GetBranchRoleAsync(
        Guid userId,
        Guid branchId,
        CancellationToken cancellationToken = default);

    Task<bool> CanManageBusinessAsync(
        Guid userId,
        Guid businessId,
        CancellationToken cancellationToken = default);

    Task<bool> CanManageBranchAsync(
        Guid userId,
        Guid branchId,
        CancellationToken cancellationToken = default);
}
