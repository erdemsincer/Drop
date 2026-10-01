using Drop.Domain.Common;

namespace Drop.Domain.Drops;

/// <summary>Days a recurring drop runs on; a bitmask so "weekdays" is one value.</summary>
[Flags]
public enum ScheduleDays
{
    None = 0,
    Monday = 1 << 0,
    Tuesday = 1 << 1,
    Wednesday = 1 << 2,
    Thursday = 1 << 3,
    Friday = 1 << 4,
    Saturday = 1 << 5,
    Sunday = 1 << 6,
    Weekdays = Monday | Tuesday | Wednesday | Thursday | Friday,
    Weekend = Saturday | Sunday,
    Everyday = Weekdays | Weekend,
}

/// <summary>
/// "Every weekday at 15:00": a drop template that publishes itself. The
/// background sweep creates each occurrence as a scheduled drop a day ahead,
/// so customers see it under "Coming up" before it starts.
/// </summary>
public sealed class DropSchedule : Entity
{
    private DropSchedule()
    {
    }

    public DropSchedule(
        Guid branchId,
        Guid createdBy,
        string title,
        string? description,
        decimal? minimumSpend,
        int capacity,
        TimeSpan duration,
        TimeSpan claimDuration,
        DropCategory category,
        decimal? originalPrice,
        decimal? dealPrice,
        Guid? photoId,
        TimeOnly startTime,
        ScheduleDays days,
        DateTimeOffset now)
    {
        if (branchId == Guid.Empty)
            throw new ArgumentException("Branch id cannot be empty.");

        if ((days & ScheduleDays.Everyday) == ScheduleDays.None)
            throw new DropDomainException("schedule.no_days", "Pick at least one day.");

        // Builds a throwaway drop so every rule (title, capacity, pricing...) is checked exactly as for a real one.
        _ = Template(branchId, title, description, minimumSpend, capacity, duration, claimDuration, category, originalPrice, dealPrice, photoId);

        BranchId = branchId;
        CreatedBy = createdBy;
        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        MinimumSpend = minimumSpend;
        Capacity = capacity;
        Duration = duration;
        ClaimDuration = claimDuration;
        Category = category;
        OriginalPrice = originalPrice;
        DealPrice = dealPrice;
        PhotoId = photoId;
        StartTime = startTime;
        Days = days & ScheduleDays.Everyday;
        CreatedAt = now;
    }

    public Guid BranchId { get; private set; }

    public Guid CreatedBy { get; private set; }

    public string Title { get; private set; } = null!;

    public string? Description { get; private set; }

    public decimal? MinimumSpend { get; private set; }

    public int Capacity { get; private set; }

    public TimeSpan Duration { get; private set; }

    public TimeSpan ClaimDuration { get; private set; }

    public DropCategory Category { get; private set; }

    public decimal? OriginalPrice { get; private set; }

    public decimal? DealPrice { get; private set; }

    public Guid? PhotoId { get; private set; }

    /// <summary>Local (Turkey) time of day each occurrence starts.</summary>
    public TimeOnly StartTime { get; private set; }

    public ScheduleDays Days { get; private set; }

    public bool IsPaused { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>Start of the latest occurrence already created; the next one comes after it.</summary>
    public DateTimeOffset? LastOccurrenceAt { get; private set; }

    public void Pause() => IsPaused = true;

    public void Resume() => IsPaused = false;

    /// <summary>The first start strictly after <paramref name="after"/>, on one of <see cref="Days"/>.</summary>
    public DateTimeOffset NextStartAfter(DateTimeOffset after)
    {
        var localDate = DateOnly.FromDateTime(TurkeyTime.ToLocal(after).DateTime);

        for (var offset = 0; offset <= 7; offset++)
        {
            var date = localDate.AddDays(offset);
            if (!Days.HasFlag(DayOf(date.DayOfWeek))) continue;

            var start = TurkeyTime.At(date, StartTime);
            if (start > after) return start;
        }

        // Unreachable while at least one day is set.
        throw new InvalidOperationException("Schedule has no days.");
    }

    /// <summary>Creates the occurrence starting at <paramref name="startsAt"/> as a scheduled drop.</summary>
    public Drop CreateOccurrence(DateTimeOffset startsAt, DateTimeOffset now)
    {
        var drop = Template(BranchId, Title, Description, MinimumSpend, Capacity, Duration, ClaimDuration, Category, OriginalPrice, DealPrice, PhotoId);
        drop.Schedule(startsAt, now);
        drop.FromSchedule(Id);
        LastOccurrenceAt = startsAt;
        return drop;
    }

    private static Drop Template(
        Guid branchId,
        string title,
        string? description,
        decimal? minimumSpend,
        int capacity,
        TimeSpan duration,
        TimeSpan claimDuration,
        DropCategory category,
        decimal? originalPrice,
        decimal? dealPrice,
        Guid? photoId)
    {
        var drop = new Drop(branchId, title, description, minimumSpend, capacity, duration, claimDuration, category);
        drop.SetPricing(originalPrice, dealPrice);
        drop.SetPhoto(photoId);
        return drop;
    }

    private static ScheduleDays DayOf(DayOfWeek day) => day switch
    {
        DayOfWeek.Monday => ScheduleDays.Monday,
        DayOfWeek.Tuesday => ScheduleDays.Tuesday,
        DayOfWeek.Wednesday => ScheduleDays.Wednesday,
        DayOfWeek.Thursday => ScheduleDays.Thursday,
        DayOfWeek.Friday => ScheduleDays.Friday,
        DayOfWeek.Saturday => ScheduleDays.Saturday,
        _ => ScheduleDays.Sunday,
    };
}
