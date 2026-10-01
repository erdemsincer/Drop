namespace Drop.Application.Notifications.Push;

public sealed record PushMessage(
    string To,
    string Title,
    string Body,
    IReadOnlyDictionary<string, string> Data);

/// <param name="DeviceGone">The token is dead (app uninstalled); stop sending to it.</param>
public sealed record PushResult(string To, bool DeviceGone);

public interface IPushSender
{
    /// <summary>Best effort: failures are logged, not thrown.</summary>
    Task<IReadOnlyList<PushResult>> SendAsync(
        IReadOnlyList<PushMessage> messages,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Tells followers that a drop went live. Enqueue is instant and never throws;
/// the fan-out happens in the background so publishing stays fast.
/// </summary>
public interface IDropLiveNotifier
{
    void Enqueue(Guid dropId);
}

/// <summary>Tells the business's team that someone just caught one of their drops.</summary>
public interface IClaimCreatedNotifier
{
    void Enqueue(Guid claimId);
}
