using Drop.Application.Notifications;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Drop.Infrastructure.Notifications;

/// <summary>
/// Used when no SMTP server is configured. In Development the message is
/// logged so reset codes can be tested locally; elsewhere only a warning is
/// logged, never the content (it contains secrets).
/// </summary>
internal sealed class DevelopmentEmailSender : IEmailSender
{
    private readonly ILogger<DevelopmentEmailSender> _logger;
    private readonly bool _isDevelopment;

    public DevelopmentEmailSender(ILogger<DevelopmentEmailSender> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _isDevelopment = environment.IsDevelopment();
    }

    public Task SendAsync(
        string to,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (_isDevelopment)
        {
            _logger.LogInformation("[DEV EMAIL] To: {To} | {Subject}\n{Body}", to, subject, body);
        }
        else
        {
            _logger.LogWarning("E-mail not sent: neither Email:ResendApiKey nor Email:SmtpHost is configured. Subject: {Subject}", subject);
        }

        return Task.CompletedTask;
    }
}
