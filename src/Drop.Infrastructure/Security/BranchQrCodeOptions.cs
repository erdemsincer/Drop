namespace Drop.Infrastructure.Security;

public sealed class BranchQrCodeOptions
{
    public const string SectionName = "Qr";

    /// <summary>HMAC key, at least 32 characters. Keep it out of source control in production.</summary>
    public string SigningKey { get; set; } = null!;

    public int PeriodSeconds { get; set; } = 30;

    /// <summary>How many previous steps are still accepted (scan/network latency).</summary>
    public int AcceptedPastSteps { get; set; } = 2;
}
