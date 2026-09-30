namespace Drop.Application.Drops.GetNearbyDrops;

public interface INearbyDropQuery
{
    Task<IReadOnlyList<NearbyDropResponse>> ExecuteAsync(
        double latitude,
        double longitude,
        double radiusKm,
        DateTimeOffset now,
        Drop.Domain.Drops.DropCategory? category,
        CancellationToken cancellationToken = default);
}
