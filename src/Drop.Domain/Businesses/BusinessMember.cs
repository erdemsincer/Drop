using Drop.Domain.Common;

namespace Drop.Domain.Businesses;

public sealed class BusinessMember : Entity
{
    private BusinessMember()
    {
    }

    public BusinessMember(
        Guid businessId,
        Guid userId,
        BusinessMemberRole role)
    {
        if (businessId == Guid.Empty)
        {
            throw new ArgumentException("Business id cannot be empty.");
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id cannot be empty.");
        }

        BusinessId = businessId;
        UserId = userId;
        Role = role;
    }

    public Guid BusinessId { get; private set; }

    public Guid UserId { get; private set; }

    public BusinessMemberRole Role { get; private set; }
}
