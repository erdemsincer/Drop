using System.Net.Http.Json;
using Drop.Application.Notifications;
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

    public ResendEmailSender(IHttpClientFactory httpClientFactory, IOptions<EmailOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
    }

    public async Task SendAsync(
        string to,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient(ClientName);

        using var response = await client.PostAsJsonAsync(
            "/emails",
            new { from = _options.From, to = new[] { to }, subject, text = body },
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            // The body names the problem (unverified domain, bad key...) but never the recipient's data.
            var detail = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Resend rejected the e-mail ({(int)response.StatusCode}): {detail}");
        }
    }
}
