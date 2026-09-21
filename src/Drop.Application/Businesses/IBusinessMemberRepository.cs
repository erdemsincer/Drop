using Drop.Domain.Businesses;

namespace Drop.Application.Businesses;

public interface IBusinessMemberRepository
{
    Task AddAsync(
        BusinessMember member,
        CancellationToken cancellationToken = default);
}
