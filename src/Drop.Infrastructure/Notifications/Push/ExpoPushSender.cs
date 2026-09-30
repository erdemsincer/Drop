using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Drop.Application.Notifications.Push;
using Microsoft.Extensions.Logging;

namespace Drop.Infrastructure.Notifications.Push;

/// <summary>Sends through Expo's push service (https://docs.expo.dev/push-notifications/sending-notifications/).</summary>
internal sealed class ExpoPushSender : IPushSender
{
    public const string ClientName = "expo-push";

    // Expo accepts at most 100 messages per request.
    private const int BatchSize = 100;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExpoPushSender> _logger;

    public ExpoPushSender(IHttpClientFactory httpClientFactory, ILogger<ExpoPushSender> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PushResult>> SendAsync(
        IReadOnlyList<PushMessage> messages,
        CancellationToken cancellationToken = default)
    {
        var results = new List<PushResult>();
        var client = _httpClientFactory.CreateClient(ClientName);

        foreach (var batch in messages.Chunk(BatchSize))
        {
            try
            {
                var payload = batch.Select(message => new ExpoMessage(
                    message.To, message.Title, message.Body, message.Data, "default", "high"));

                using var response = await client.PostAsJsonAsync("/--/api/v2/push/send", payload, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Expo push rejected a batch of {Count}: {Status}", batch.Length, (int)response.StatusCode);
                    continue;
                }

                var body = await response.Content.ReadFromJsonAsync<ExpoResponse>(cancellationToken);
                var tickets = body?.Data ?? [];

                // Tickets come back in message order.
                for (var i = 0; i < batch.Length && i < tickets.Count; i++)
                {
                    var gone = tickets[i].Status == "error" && tickets[i].Details?.Error == "DeviceNotRegistered";
                    results.Add(new PushResult(batch[i].To, gone));
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
            {
                _logger.LogWarning(ex, "Expo push batch of {Count} failed", batch.Length);
            }
        }

        return results;
    }

    private sealed record ExpoMessage(
        [property: JsonPropertyName("to")] string To,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("body")] string Body,
        [property: JsonPropertyName("data")] IReadOnlyDictionary<string, string> Data,
        [property: JsonPropertyName("sound")] string Sound,
        [property: JsonPropertyName("priority")] string Priority);

    private sealed record ExpoResponse([property: JsonPropertyName("data")] List<ExpoTicket>? Data);

    private sealed record ExpoTicket(
        [property: JsonPropertyName("status")] string Status,
        [property: JsonPropertyName("details")] ExpoTicketDetails? Details);

    private sealed record ExpoTicketDetails([property: JsonPropertyName("error")] string? Error);
}
