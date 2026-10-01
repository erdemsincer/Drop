using Drop.Application.Drops.GetUpcomingDrops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class UpcomingDropQuery : IUpcomingDropQuery
{
    // Far enough ahead to plan around, near enough to still be exciting.
    private static readonly TimeSpan Horizon = TimeSpan.FromDays(7);

    private readonly DropDbContext _dbContext;

    public UpcomingDropQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<UpcomingDropResponse>> ExecuteAsync(
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
                d."Category" AS "Category",
                d."Capacity" AS "Capacity",
                ROUND(
                    ST_Distance(b.location, ST_SetSRID(ST_MakePoint({1}, {0}), 4326)::geography)
                )::int AS "DistanceMeters",
                d."StartsAt" AS "StartsAt",
                d."EndsAt" AS "EndsAt",
                d."OriginalPrice" AS "OriginalPrice",
                d."DealPrice" AS "DealPrice",
                d."PhotoId" AS "PhotoId"
            FROM drops d
            INNER JOIN branches b ON b."Id" = d."BranchId"
            INNER JOIN businesses bus ON bus."Id" = b."BusinessId"
            WHERE d."Status" = 'Scheduled'
              AND b."ClosedAt" IS NULL
              AND d."StartsAt" > {3}
              AND d."StartsAt" <= {4}
              AND ST_DWithin(b.location, ST_SetSRID(ST_MakePoint({1}, {0}), 4326)::geography, {2})
            ORDER BY d."StartsAt"
            LIMIT 30;
            """;

        return await _dbContext.Database
            .SqlQueryRaw<UpcomingDropResponse>(sql, latitude, longitude, radiusKm * 1000, now, now.Add(Horizon))
            .ToListAsync(cancellationToken);
    }
}
