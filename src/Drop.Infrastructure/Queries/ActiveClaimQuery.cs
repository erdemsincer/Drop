using Drop.Application.Features.Claims.ActiveClaim;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class ActiveClaimQuery : IActiveClaimQuery
{
    private readonly DropDbContext _dbContext;

    public ActiveClaimQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ActiveClaimResponse?> GetAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        const string sql =
            """
            SELECT
                c."Id" AS "ClaimId",
                d."Id" AS "DropId",
                bus."Name" AS "BusinessName",
                b."Name" AS "BranchName",
                d."Title" AS "DropTitle",
                c."ExpiresAt" AS "ExpiresAt",
                b."Latitude" AS "Latitude",
                b."Longitude" AS "Longitude"
            FROM claims c
            INNER JOIN drops d ON d."Id" = c."DropId"
            INNER JOIN branches b ON b."Id" = d."BranchId"
            INNER JOIN businesses bus ON bus."Id" = b."BusinessId"
            WHERE c."UserId" = {0}
              AND c."Status" = 'Active'
              AND c."ExpiresAt" > {1}
            ORDER BY c."ExpiresAt" DESC
            LIMIT 1
            """;

        // The SQL already orders and limits to one row; materialising the list
        // avoids EF's "FirstOrDefault without OrderBy" warning on raw SQL.
        var rows = await _dbContext
            .Database
            .SqlQueryRaw<ActiveClaimResponse>(sql, userId, now)
            .ToListAsync(cancellationToken);

        return rows.FirstOrDefault();
    }
}
