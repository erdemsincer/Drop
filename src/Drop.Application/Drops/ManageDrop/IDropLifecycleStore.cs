namespace Drop.Application.Drops.ManageDrop;

public interface IDropLifecycleStore
{
    /// <summary>Stops new claims; existing reservations stay redeemable.</summary>
    Task<DropLifecycleResponse> EndAsync(
        Guid dropId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);

    /// <summary>Cancels the drop and its unused reservations.</summary>
    Task<DropLifecycleResponse> CancelAsync(
        Guid dropId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
