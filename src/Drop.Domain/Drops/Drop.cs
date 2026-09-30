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
        TimeSpan claimDuration,
        DropCategory category = DropCategory.Other)
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
        Category = category;

        Status = DropStatus.Draft;
    }

    public Guid BranchId { get; private set; }

    public string Title { get; private set; } = null!;

    public string? Description { get; private set; }

    public decimal? MinimumSpend { get; private set; }

    public int Capacity { get; private set; }

    public TimeSpan Duration { get; private set; }

    public TimeSpan ClaimDuration { get; private set; }

    public DropCategory Category { get; private set; }

    public DropStatus Status { get; private set; }

    public DateTimeOffset? StartsAt { get; private set; }

    public DateTimeOffset? EndsAt { get; private set; }

    public void Activate(DateTimeOffset now)
    {
        if (Status != DropStatus.Draft)
            throw new DropDomainException(
                "drop.not_draft",
                "Only draft drops can be activated.");

        Status = DropStatus.Active;
        StartsAt = now;
        EndsAt = now.Add(Duration);
    }

    /// <summary>Publishes later: stays invisible until activated at <paramref name="startsAt"/>.</summary>
    public void Schedule(DateTimeOffset startsAt, DateTimeOffset now)
    {
        if (Status != DropStatus.Draft)
            throw new DropDomainException(
                "drop.not_draft",
                "Only draft drops can be scheduled.");

        if (startsAt <= now)
            throw new DropDomainException(
                "drop.start_in_past",
                "A scheduled drop must start in the future.");

        Status = DropStatus.Scheduled;
        StartsAt = startsAt;
        EndsAt = startsAt.Add(Duration);
    }

    public bool IsScheduled(DateTimeOffset now) =>
        Status == DropStatus.Scheduled && StartsAt > now;

    public bool IsLive(DateTimeOffset now) =>
        Status == DropStatus.Active && EndsAt > now;

    /// <summary>
    /// Stops new claims now. Existing reservations stay valid and can still be redeemed.
    /// </summary>
    public void End(DateTimeOffset now)
    {
        EnsureLive(now);

        Status = DropStatus.Expired;
        EndsAt = now;
    }

    /// <summary>
    /// Withdraws a live or scheduled drop. Callers must also cancel its active claims.
    /// </summary>
    public void Cancel(DateTimeOffset now)
    {
        EnsureLiveOrScheduled(now);

        Status = DropStatus.Cancelled;
        EndsAt = now;
    }

    /// <summary>
    /// Edits a live drop. Capacity may grow freely but never drop below the
    /// places already taken (live reservations + redemptions).
    /// </summary>
    public void UpdateDetails(
        string title,
        string? description,
        decimal? minimumSpend,
        int capacity,
        int occupied,
        DateTimeOffset now,
        DropCategory? category = null)
    {
        EnsureLiveOrScheduled(now);

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty.");

        if (minimumSpend < 0)
            throw new ArgumentOutOfRangeException(nameof(minimumSpend));

        if (capacity <= 0)
            throw new ArgumentOutOfRangeException(nameof(capacity));

        if (capacity < occupied)
            throw new DropDomainException(
                "drop.capacity_below_claimed",
                $"Capacity cannot be lower than the {occupied} places already taken.");

        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        MinimumSpend = minimumSpend;
        Capacity = capacity;
        Category = category ?? Category;
    }

    private void EnsureLiveOrScheduled(DateTimeOffset now)
    {
        if (!IsLive(now) && !IsScheduled(now))
            throw new DropDomainException(
                "drop.not_active",
                "Only live or scheduled drops can be changed.");
    }

    private void EnsureLive(DateTimeOffset now)
    {
        if (!IsLive(now))
            throw new DropDomainException(
                "drop.not_active",
                "Only live drops can be ended or cancelled.");
    }
}
