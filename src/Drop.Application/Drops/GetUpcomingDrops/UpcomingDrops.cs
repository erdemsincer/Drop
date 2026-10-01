namespace Drop.Application.Drops.GetUpcomingDrops;

/// <summary>A scheduled drop near the customer: visible ahead of time so they can set a reminder.</summary>
public sealed record UpcomingDropResponse(
    Guid Id,
    Guid BranchId,
    string BusinessName,
    string BranchName,
    string Title,
    string Category,
    int Capacity,
    int DistanceMeters,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    decimal? OriginalPrice,
    decimal? DealPrice,
    Guid? PhotoId);

public interface IUpcomingDropQuery
{
    Task<IReadOnlyList<UpcomingDropResponse>> ExecuteAsync(
        double latitude,
        double longitude,
        double radiusKm,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}

public sealed class GetUpcomingDropsService
{
    private readonly IUpcomingDropQuery _query;
    private readonly TimeProvider _timeProvider;

    public GetUpcomingDropsService(IUpcomingDropQuery query, TimeProvider timeProvider)
    {
        _query = query;
        _timeProvider = timeProvider;
    }

    public Task<IReadOnlyList<UpcomingDropResponse>> ExecuteAsync(
        double latitude,
        double longitude,
        double radiusKm,
        CancellationToken cancellationToken = default) =>
        _query.ExecuteAsync(latitude, longitude, radiusKm, _timeProvider.GetUtcNow(), cancellationToken);
}
