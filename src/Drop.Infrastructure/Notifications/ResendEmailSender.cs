using System.Net.Http.Json;
using Drop.Application.Notifications;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Drop.Infrastructure.Notifications;

/// <summary>
/// Sends through Resend's HTTPS API. Preferred over SMTP: hosts such as Railway
/// block outbound SMTP ports on their cheaper plans, while HTTPS always works.
/// </summary>
internal sealed class ResendEmailSender : IEmailSender
{
    public const string ClientName = "resend";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly EmailOptions _options;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(
        IHttpClientFactory httpClientFactory,
        IOptions<EmailOptions> options,
        ILogger<ResendEmailSender> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string to,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient(ClientName);

        // Callers treat mail as best effort and swallow failures, so this is where they get logged.
        // Recipients are never logged; the subject says which mail it was.
        try
        {
            using var response = await client.PostAsJsonAsync(
                "/emails",
                new { from = _options.From, to = new[] { to }, subject, text = body },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                // Resend explains the problem (unverified domain, bad key, test-sender limits...).
                var detail = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new InvalidOperationException($"Resend rejected the e-mail ({(int)response.StatusCode}): {detail}");
            }

            _logger.LogInformation("E-mail sent via Resend: {Subject}", subject);
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "E-mail via Resend failed: {Subject}", subject);
            throw;
        }
    }
}
