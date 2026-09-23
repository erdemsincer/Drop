using Drop.Application.Businesses.GetMyBusinesses;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class MyBusinessesQuery : IMyBusinessesQuery
{
    private readonly DropDbContext _dbContext;

    public MyBusinessesQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<MyBusinessResponse>> GetAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from member in _dbContext.BusinessMembers
            join business in _dbContext.Businesses
                on member.BusinessId equals business.Id
            where member.UserId == userId
            orderby business.Name
            select new MyBusinessResponse(
                business.Id,
                business.Name,
                member.Role,
                _dbContext.Branches.Count(branch => branch.BusinessId == business.Id))
        ).AsNoTracking().ToListAsync(cancellationToken);
    }
}
