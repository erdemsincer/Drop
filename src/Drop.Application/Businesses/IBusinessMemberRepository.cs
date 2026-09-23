using Drop.Domain.Businesses;

namespace Drop.Application.Businesses;

public interface IBusinessMemberRepository
{
    Task AddAsync(
        BusinessMember member,
        CancellationToken cancellationToken = default);

    Task<BusinessMember?> GetAsync(
        Guid businessId,
        Guid userId,
        CancellationToken cancellationToken = default);

    void Remove(BusinessMember member);
}
