using Drop.Application.Businesses.Members;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BusinessMembersQuery : IBusinessMembersQuery
{
    private readonly DropDbContext _dbContext;

    public BusinessMembersQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<MemberRow>> GetAsync(
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        var rows = await (
            from member in _dbContext.BusinessMembers
            join user in _dbContext.Users on member.UserId equals user.Id
            where member.BusinessId == businessId
            select new MemberRow(user.Id, user.FirstName, user.LastName, user.Email, member.Role)
        ).AsNoTracking().ToListAsync(cancellationToken);

        // Owner first, then managers, then staff; alphabetical within a role.
        return rows
            .OrderBy(row => row.Role)
            .ThenBy(row => row.FirstName)
            .ThenBy(row => row.LastName)
            .ToList();
    }
}
