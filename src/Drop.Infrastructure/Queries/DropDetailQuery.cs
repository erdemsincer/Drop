using Drop.Application.Features.Drops.GetDropDetail;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class DropDetailQuery : IDropDetailQuery
{
    private readonly DropDbContext _dbContext;

    public DropDetailQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DropDetailResponse?> GetAsync(
        Guid dropId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        const string sql =
            """
            SELECT
                d."Id" AS "Id",
                b."Id" AS "BranchId",
                bus."Id" AS "BusinessId",
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
                      AND (
                        c."Status" = 'Redeemed'
                        OR (c."Status" = 'Active' AND c."ExpiresAt" > {1})
                      )
                ) AS "ClaimedCount",

                (
                    d."Capacity" -
                    (
                        SELECT COUNT(*)::int
                        FROM claims c
                        WHERE c."DropId" = d."Id"
                          AND (
                            c."Status" = 'Redeemed'
                            OR (c."Status" = 'Active' AND c."ExpiresAt" > {1})
                          )
                    )
                ) AS "RemainingCapacity",

                d."StartsAt" AS "StartsAt",
                d."EndsAt" AS "EndsAt",
                d."ClaimDurationMinutes" AS "ClaimDurationMinutes",
                b."Latitude" AS "Latitude",
                b."Longitude" AS "Longitude",
                d."Category" AS "Category",

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
                d."PhotoId" AS "PhotoId",
                d."IsMystery" AS "IsMystery",
                d."Hint" AS "Hint",
                false AS "IsLocked",
                NULL::int AS "DistanceMeters"
            FROM drops d
            INNER JOIN branches b ON b."Id" = d."BranchId"
            INNER JOIN businesses bus ON bus."Id" = b."BusinessId"
            WHERE d."Id" = {0}
            """;

        // WHERE on the primary key yields at most one row.
        var rows = await _dbContext
            .Database
            .SqlQueryRaw<DropDetailResponse>(sql, dropId, now)
            .ToListAsync(cancellationToken);

        return rows.FirstOrDefault();
    }
}
