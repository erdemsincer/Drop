namespace Drop.Infrastructure.Notifications;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Any SMTP provider works (Resend, SendGrid, Brevo, Mailgun, ...). Empty = not configured.</summary>
    public string? SmtpHost { get; set; }

    public int SmtpPort { get; set; } = 587;

    public string? SmtpUser { get; set; }

    public string? SmtpPassword { get; set; }

    public bool EnableSsl { get; set; } = true;

    public string From { get; set; } = "Drop <no-reply@drop.app>";
}
