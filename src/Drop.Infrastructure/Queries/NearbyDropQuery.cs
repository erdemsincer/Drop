using Drop.Application.Drops.GetNearbyDrops;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class NearbyDropQuery : INearbyDropQuery
{
    private readonly DropDbContext _dbContext;

    public NearbyDropQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<NearbyDropResponse>> ExecuteAsync(
        double latitude,
        double longitude,
        double radiusKm,
        DateTimeOffset now,
        DropCategory? category,
        CancellationToken cancellationToken = default)
    {
        const string select =
            """
            SELECT
                d."Id" AS "Id",
                b."Id" AS "BranchId",
                bus."Name" AS "BusinessName",
                b."Name" AS "BranchName",
                d."Title" AS "Title",
                d."Description" AS "Description",
                d."MinimumSpend" AS "MinimumSpend",
                d."Capacity" AS "Capacity",

                (
                    SELECT COUNT(*)::int
                    FROM claims c
                    WHERE c."DropId" = d."Id"
                      AND (c."Status" = 'Redeemed' OR (c."Status" = 'Active' AND c."ExpiresAt" > {3}))
                ) AS "ClaimedCount",

                (
                    d."Capacity" -
                    (
                        SELECT COUNT(*)::int
                        FROM claims c
                        WHERE c."DropId" = d."Id"
                          AND (c."Status" = 'Redeemed' OR (c."Status" = 'Active' AND c."ExpiresAt" > {3}))
                    )
                ) AS "RemainingCapacity",

                ROUND(
                    ST_Distance(
                        b.location,
                        ST_SetSRID(
                            ST_MakePoint({1}, {0}),
                            4326
                        )::geography
                    )
                )::int AS "DistanceMeters",

                d."EndsAt" AS "EndsAt",

                d."Category" AS "Category",

                b."Latitude" AS "Latitude",
                b."Longitude" AS "Longitude",


                (
                    SELECT ROUND(AVG(rc."Rating")::numeric, 1)::float8
                    FROM claims rc
                    INNER JOIN drops rd ON rd."Id" = rc."DropId"
                    INNER JOIN branches rb ON rb."Id" = rd."BranchId"
                    WHERE rb."BusinessId" = bus."Id" AND rc."Rating" IS NOT NULL
                ) AS "BusinessRating",

                (
                    SELECT COUNT(*)::int
                    FROM claims rc
                    INNER JOIN drops rd ON rd."Id" = rc."DropId"
                    INNER JOIN branches rb ON rb."Id" = rd."BranchId"
                    WHERE rb."BusinessId" = bus."Id" AND rc."Rating" IS NOT NULL
                ) AS "BusinessRatingCount",

                d."OriginalPrice" AS "OriginalPrice",
                d."DealPrice" AS "DealPrice",
                d."PhotoId" AS "PhotoId"

            FROM drops d

            INNER JOIN branches b
                ON b."Id" = d."BranchId"

            INNER JOIN businesses bus
                ON bus."Id" = b."BusinessId"

            WHERE d."Status" = 'Active'

              AND b."ClosedAt" IS NULL

              AND d."EndsAt" > {3}

              AND ST_DWithin(
                    b.location,
                    ST_SetSRID(
                        ST_MakePoint({1}, {0}),
                        4326
                    )::geography,
                    {2}
              )
            """;

        const string order =
            """

            ORDER BY "DistanceMeters"
            LIMIT 100;
            """;

        var radiusMeters = radiusKm * 1000;

        object[] parameters = category is { } filter
            ? [latitude, longitude, radiusMeters, now, filter.ToString()]
            : [latitude, longitude, radiusMeters, now];

        var sql = category is null
            ? select + order
            : select + "\n  AND d.\"Category\" = {4}" + order;

        return await _dbContext.Database
            .SqlQueryRaw<NearbyDropResponse>(sql, parameters)
            .ToListAsync(cancellationToken);
    }
}
