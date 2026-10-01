using System.Net;
using System.Net.Mail;
using Drop.Application.Notifications;
using Microsoft.Extensions.Options;

namespace Drop.Infrastructure.Notifications;

internal sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;

    public SmtpEmailSender(IOptions<EmailOptions> options)
    {
        _options = options.Value;
    }

    // A blocked or silent SMTP port must not hang the request that sends the mail.
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(15);

    public async Task SendAsync(
        string to,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.EnableSsl,
            Credentials = string.IsNullOrEmpty(_options.SmtpUser)
                ? null
                : new NetworkCredential(_options.SmtpUser, _options.SmtpPassword),
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_options.From),
            Subject = subject,
            Body = body,
        };
        message.To.Add(to);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(SendTimeout);

        await client.SendMailAsync(message, timeout.Token);
    }
}
