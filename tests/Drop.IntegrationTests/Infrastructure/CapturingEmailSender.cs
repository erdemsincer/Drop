using System.Collections.Concurrent;
using Drop.Application.Notifications;

namespace Drop.IntegrationTests.Infrastructure;

/// <summary>Records outgoing e-mails so tests can read reset codes.</summary>
public sealed class CapturingEmailSender : IEmailSender
{
    public ConcurrentQueue<(string To, string Subject, string Body)> Sent { get; } = new();

    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        Sent.Enqueue((to, subject, body));
        return Task.CompletedTask;
    }

    public string? LastBodyTo(string to) =>
        Sent.LastOrDefault(mail => string.Equals(mail.To, to, StringComparison.OrdinalIgnoreCase)).Body;
}
