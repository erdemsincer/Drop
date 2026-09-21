namespace Drop.Application.Drops.GetNearbyDrops;

public sealed class GetNearbyDropsService
{
    private const double MaxRadiusKm = 20;

    private readonly INearbyDropQuery _query;
    private readonly TimeProvider _timeProvider;

    public GetNearbyDropsService(
        INearbyDropQuery query,
        TimeProvider timeProvider)
    {
        _query = query;
        _timeProvider = timeProvider;
    }

    public Task<IReadOnlyList<NearbyDropResponse>> ExecuteAsync(
        double latitude,
        double longitude,
        double radiusKm,
        CancellationToken cancellationToken = default)
    {
        if (latitude is < -90 or > 90)
            throw new ArgumentOutOfRangeException(nameof(latitude));

        if (longitude is < -180 or > 180)
            throw new ArgumentOutOfRangeException(nameof(longitude));

        if (radiusKm is <= 0 or > MaxRadiusKm)
            throw new ArgumentOutOfRangeException(nameof(radiusKm));

        return _query.ExecuteAsync(
            latitude,
            longitude,
            radiusKm,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
