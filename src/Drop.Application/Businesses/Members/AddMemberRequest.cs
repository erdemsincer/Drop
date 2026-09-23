using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.Members;

public sealed record AddMemberRequest(
    string Email,
    BusinessMemberRole Role);
