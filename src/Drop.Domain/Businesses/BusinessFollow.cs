using Drop.Domain.Common;

namespace Drop.Domain.Businesses;

/// <summary>A customer following a business to hear about its new drops.</summary>
public sealed class BusinessFollow : Entity
{
    private BusinessFollow()
    {
    }

    public BusinessFollow(Guid userId, Guid businessId, DateTimeOffset createdAt)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("User id cannot be empty.", nameof(userId));

        if (businessId == Guid.Empty)
            throw new ArgumentException("Business id cannot be empty.", nameof(businessId));

        UserId = userId;
        BusinessId = businessId;
        CreatedAt = createdAt;
    }

    public Guid UserId { get; private set; }

    public Guid BusinessId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
}
