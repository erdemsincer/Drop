using Drop.Application.Businesses;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;

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
}
