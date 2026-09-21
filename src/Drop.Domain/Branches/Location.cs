namespace Drop.Domain.Branches;

public sealed record Location
{
    private Location()
    {
    }

    public Location(double latitude, double longitude)
    {
        if (latitude is < -90 or > 90)
            throw new ArgumentOutOfRangeException(nameof(latitude));

        if (longitude is < -180 or > 180)
            throw new ArgumentOutOfRangeException(nameof(longitude));

        Latitude = latitude;
        Longitude = longitude;
    }

    public double Latitude { get; private init; }

    public double Longitude { get; private init; }
}
