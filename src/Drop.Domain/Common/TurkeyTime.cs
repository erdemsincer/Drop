namespace Drop.Domain.Common;

/// <summary>Drop runs on Turkish wall-clock time (UTC+3 all year, no DST).</summary>
public static class TurkeyTime
{
    public static readonly TimeZoneInfo Zone = Load();

    public static DateTimeOffset ToLocal(DateTimeOffset moment) => TimeZoneInfo.ConvertTime(moment, Zone);

    /// <summary>The UTC instant of a local date and time in Turkey.</summary>
    public static DateTimeOffset At(DateOnly date, TimeOnly time)
    {
        var local = date.ToDateTime(time);
        return new DateTimeOffset(local, Zone.GetUtcOffset(local)).ToUniversalTime();
    }

    private static TimeZoneInfo Load()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            // Slim containers may lack tzdata; Turkey has been fixed at UTC+3 since 2016.
            return TimeZoneInfo.CreateCustomTimeZone("Europe/Istanbul", TimeSpan.FromHours(3), "Istanbul", "Istanbul");
        }
    }
}
