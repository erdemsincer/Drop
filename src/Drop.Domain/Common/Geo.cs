namespace Drop.Domain.Common;

public static class Geo
{
    private const double EarthRadiusMeters = 6_371_000;

    /// <summary>Great-circle distance in metres (haversine); plenty accurate at walking distances.</summary>
    public static double DistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        static double Rad(double degrees) => degrees * Math.PI / 180;

        var dLat = Rad(lat2 - lat1);
        var dLon = Rad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        return 2 * EarthRadiusMeters * Math.Asin(Math.Sqrt(a));
    }
}
