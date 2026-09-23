namespace Drop.Infrastructure.BackgroundJobs;

public sealed class ExpirationOptions
{
    public const string SectionName = "BackgroundJobs:Expiration";

    public bool Enabled { get; set; } = true;

    public int IntervalSeconds { get; set; } = 60;
}
