using System.Collections.Concurrent;
using Drop.Application.Notifications.Push;

namespace Drop.IntegrationTests.Infrastructure;

/// <summary>Records pushes; tokens listed in <see cref="GoneTokens"/> answer "DeviceNotRegistered".</summary>
public sealed class CapturingPushSender : IPushSender
{
    public ConcurrentQueue<PushMessage> Sent { get; } = new();

    public ConcurrentDictionary<string, bool> GoneTokens { get; } = new();

    public Task<IReadOnlyList<PushResult>> SendAsync(
        IReadOnlyList<PushMessage> messages,
        CancellationToken cancellationToken = default)
    {
        foreach (var message in messages)
        {
            Sent.Enqueue(message);
        }

        IReadOnlyList<PushResult> results = messages
            .Select(message => new PushResult(message.To, GoneTokens.ContainsKey(message.To)))
            .ToList();

        return Task.FromResult(results);
    }

    /// <summary>The dispatcher runs in the background; wait until a push for the token shows up.</summary>
    public async Task<PushMessage?> WaitForAsync(string token, TimeSpan? timeout = null)
    {
        var deadline = DateTime.UtcNow + (timeout ?? TimeSpan.FromSeconds(5));

        while (DateTime.UtcNow < deadline)
        {
            var match = Sent.LastOrDefault(message => message.To == token);
            if (match is not null) return match;
            await Task.Delay(50);
        }

        return null;
    }
}
