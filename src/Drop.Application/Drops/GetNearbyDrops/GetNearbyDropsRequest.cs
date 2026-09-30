namespace Drop.Application.Drops.GetNearbyDrops;

public sealed record GetNearbyDropsRequest(
    double Latitude,
    double Longitude,
    double RadiusKm = 5,
    Drop.Domain.Drops.DropCategory? Category = null);
