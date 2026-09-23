using Drop.Application.Businesses;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Businesses;

internal sealed class BusinessAccessService : IBusinessAccessService
{
    private readonly DropDbContext _dbContext;

    public BusinessAccessService(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BusinessMemberRole?> GetBusinessRoleAsync(
        Guid userId,
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.BusinessMembers
            .Where(member => member.BusinessId == businessId && member.UserId == userId)
            .Select(member => (BusinessMemberRole?)member.Role)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<BusinessMemberRole?> GetBranchRoleAsync(
        Guid userId,
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from branch in _dbContext.Branches
            join member in _dbContext.BusinessMembers
                on branch.BusinessId equals member.BusinessId
            where branch.Id == branchId && member.UserId == userId
            select (BusinessMemberRole?)member.Role
        ).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> CanManageBusinessAsync(
        Guid userId,
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        return BusinessRoles.CanManage(
            await GetBusinessRoleAsync(userId, businessId, cancellationToken));
    }

    public async Task<bool> CanManageBranchAsync(
        Guid userId,
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        return BusinessRoles.CanManage(
            await GetBranchRoleAsync(userId, branchId, cancellationToken));
    }
}
