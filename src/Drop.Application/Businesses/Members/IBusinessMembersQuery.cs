using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.Members;

public sealed record MemberRow(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email,
    BusinessMemberRole Role);

public interface IBusinessMembersQuery
{
    Task<IReadOnlyList<MemberRow>> GetAsync(
        Guid businessId,
        CancellationToken cancellationToken = default);
}
