using Drop.Application.Businesses;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Repositories;

internal sealed class BusinessMemberRepository : IBusinessMemberRepository
{
    private readonly DropDbContext _dbContext;

    public BusinessMemberRepository(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        BusinessMember member,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.BusinessMembers.AddAsync(member, cancellationToken);
    }

    public Task<BusinessMember?> GetAsync(
        Guid businessId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.BusinessMembers.FirstOrDefaultAsync(
            x => x.BusinessId == businessId && x.UserId == userId,
            cancellationToken);
    }

    public void Remove(BusinessMember member)
    {
        _dbContext.BusinessMembers.Remove(member);
    }
}
