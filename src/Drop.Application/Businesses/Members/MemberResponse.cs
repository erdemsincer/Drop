using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.Members;

public sealed record MemberResponse(
    Guid UserId,
    string FirstName,
    string LastName,
    string Email,
    BusinessMemberRole Role,
    bool IsCurrentUser,
    bool CanRemove);
