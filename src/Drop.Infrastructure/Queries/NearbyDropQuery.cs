using Drop.Application.Drops.GetNearbyDrops;
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
        CancellationToken cancellationToken = default)
    {
        const string sql =
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

                d."EndsAt" AS "EndsAt"

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

            ORDER BY "DistanceMeters"
            LIMIT 100;
            """;

        var radiusMeters = radiusKm * 1000;

        return await _dbContext.Database
            .SqlQueryRaw<NearbyDropResponse>(
                sql,
                latitude,
                longitude,
                radiusMeters,
                now)
            .ToListAsync(cancellationToken);
    }
}
