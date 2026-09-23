using Drop.Domain.Common;

namespace Drop.Domain.Businesses;

public sealed class Business : Entity
{
    private Business()
    {
    }

    public Business(string name, DateTimeOffset createdAt)
    {
        SetName(name);
        CreatedAt = createdAt;
        Status = BusinessStatus.Pending;
        StatusChangedAt = createdAt;
    }

    public string Name { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public BusinessStatus Status { get; private set; }

    public DateTimeOffset StatusChangedAt { get; private set; }

    /// <summary>Shown to the owner when rejected or suspended.</summary>
    public string? StatusReason { get; private set; }

    public bool CanPublishDrops => Status == BusinessStatus.Approved;

    public void ChangeName(string name)
    {
        SetName(name);
    }

    public void Approve(DateTimeOffset now)
    {
        if (Status == BusinessStatus.Approved)
            throw new BusinessDomainException("business.already_approved", "Business is already approved.");

        SetStatus(BusinessStatus.Approved, reason: null, now);
    }

    public void Reject(string reason, DateTimeOffset now)
    {
        if (Status != BusinessStatus.Pending)
            throw new BusinessDomainException("business.not_pending", "Only pending businesses can be rejected.");

        SetStatus(BusinessStatus.Rejected, RequireReason(reason), now);
    }

    public void Suspend(string reason, DateTimeOffset now)
    {
        if (Status != BusinessStatus.Approved)
            throw new BusinessDomainException("business.not_approved", "Only approved businesses can be suspended.");

        SetStatus(BusinessStatus.Suspended, RequireReason(reason), now);
    }

    private void SetStatus(BusinessStatus status, string? reason, DateTimeOffset now)
    {
        Status = status;
        StatusReason = reason;
        StatusChangedAt = now;
    }

    private static string RequireReason(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("A reason is required.", nameof(reason));

        return reason.Trim();
    }

    private void SetName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Business name cannot be empty.",
                nameof(name));
        }

        Name = name.Trim();
    }
}
