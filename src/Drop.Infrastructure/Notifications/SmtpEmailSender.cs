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

        await client.SendMailAsync(message, cancellationToken);
    }
}
