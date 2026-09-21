using Drop.Domain.Common;

namespace Drop.Domain.Drops;

public sealed class Drop : Entity
{
    private Drop()
    {
    }

    public Drop(
        Guid branchId,
        string title,
        string? description,
        decimal? minimumSpend,
        int capacity,
        TimeSpan duration,
        TimeSpan claimDuration)
    {
        if (branchId == Guid.Empty)
            throw new ArgumentException("Branch id cannot be empty.");

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty.");

        if (minimumSpend < 0)
            throw new ArgumentOutOfRangeException(nameof(minimumSpend));

        if (capacity <= 0)
            throw new ArgumentOutOfRangeException(nameof(capacity));

        if (duration <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(duration));

        if (claimDuration <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(claimDuration));

        BranchId = branchId;
        Title = title.Trim();
        Description = description?.Trim();
        MinimumSpend = minimumSpend;
        Capacity = capacity;
        Duration = duration;
        ClaimDuration = claimDuration;

        Status = DropStatus.Draft;
    }

    public Guid BranchId { get; private set; }

    public string Title { get; private set; } = null!;

    public string? Description { get; private set; }

    public decimal? MinimumSpend { get; private set; }

    public int Capacity { get; private set; }

    public TimeSpan Duration { get; private set; }

    public TimeSpan ClaimDuration { get; private set; }

    public DropStatus Status { get; private set; }

    public DateTimeOffset? StartsAt { get; private set; }

    public DateTimeOffset? EndsAt { get; private set; }

    public void Activate(DateTimeOffset now)
    {
        if (Status != DropStatus.Draft)
            throw new InvalidOperationException(
                "Only draft drops can be activated.");

        Status = DropStatus.Active;
        StartsAt = now;
        EndsAt = now.Add(Duration);
    }

    public void Cancel()
    {
        if (Status is DropStatus.Expired or DropStatus.Cancelled)
            throw new InvalidOperationException(
                "Drop cannot be cancelled.");

        Status = DropStatus.Cancelled;
    }
}
