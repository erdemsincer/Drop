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

    public async Task<bool> CanManageBranchAsync(
        Guid userId,
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from branch in _dbContext.Branches
            join member in _dbContext.BusinessMembers
                on branch.BusinessId equals member.BusinessId
            where branch.Id == branchId
                  && member.UserId == userId
                  && (member.Role == BusinessMemberRole.Owner || member.Role == BusinessMemberRole.Manager)
            select branch.Id
        ).AnyAsync(cancellationToken);
    }
}
