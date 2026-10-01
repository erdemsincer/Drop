using Drop.Domain.Drops;

namespace Drop.UnitTests.Domain;

public sealed class DropScheduleTests
{
    // Thursday 1 October 2026, 12:00 in Turkey (09:00 UTC).
    private static readonly DateTimeOffset ThursdayNoon = new(2026, 10, 1, 9, 0, 0, TimeSpan.Zero);

    private static DropSchedule Schedule(ScheduleDays days, TimeOnly at, decimal? original = null, decimal? deal = null) => new(
        Guid.NewGuid(), Guid.NewGuid(), "Kahve %30", null, null, 10,
        TimeSpan.FromHours(1), TimeSpan.FromMinutes(15), DropCategory.Coffee,
        original, deal, null, at, days, ThursdayNoon);

    [Fact]
    public void NextStart_ShouldBeLaterToday_WhenTheTimeHasNotComeYet()
    {
        var next = Schedule(ScheduleDays.Everyday, new TimeOnly(15, 0)).NextStartAfter(ThursdayNoon);

        // 15:00 Turkey time is 12:00 UTC.
        Assert.Equal(new DateTimeOffset(2026, 10, 1, 12, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void NextStart_ShouldSkipToTheNextChosenDay()
    {
        // 09:00 already passed today; weekends only → Saturday.
        var next = Schedule(ScheduleDays.Weekend, new TimeOnly(9, 0)).NextStartAfter(ThursdayNoon);

        Assert.Equal(new DateTimeOffset(2026, 10, 3, 6, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void NextStart_ShouldBeAWeekLater_WhenOnlyTodayIsChosenAndItsTimePassed()
    {
        var next = Schedule(ScheduleDays.Thursday, new TimeOnly(10, 0)).NextStartAfter(ThursdayNoon);

        Assert.Equal(new DateTimeOffset(2026, 10, 8, 7, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void CreateOccurrence_ShouldScheduleACopy_AndRememberIt()
    {
        var schedule = Schedule(ScheduleDays.Everyday, new TimeOnly(15, 0), 100m, 60m);
        var startsAt = schedule.NextStartAfter(ThursdayNoon);

        var drop = schedule.CreateOccurrence(startsAt, ThursdayNoon);

        Assert.Equal(DropStatus.Scheduled, drop.Status);
        Assert.Equal(startsAt, drop.StartsAt);
        Assert.Equal(startsAt.AddHours(1), drop.EndsAt);
        Assert.Equal(60m, drop.DealPrice);
        Assert.Equal(schedule.Id, drop.ScheduleId);
        Assert.Equal(startsAt, schedule.LastOccurrenceAt);
    }

    [Fact]
    public void Constructor_ShouldApplyTheDropRules()
    {
        var noDays = Assert.Throws<DropDomainException>(() => Schedule(ScheduleDays.None, new TimeOnly(15, 0)));
        Assert.Equal("schedule.no_days", noDays.Code);

        var badPrice = Assert.Throws<DropDomainException>(() => Schedule(ScheduleDays.Everyday, new TimeOnly(15, 0), 50m, 80m));
        Assert.Equal("drop.pricing_invalid", badPrice.Code);
    }
}
