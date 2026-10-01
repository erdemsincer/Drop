using Drop.Application.Claims.MyClaims;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class MyClaimsQuery : IMyClaimsQuery
{
    private const int MaxClaims = 50;

    private readonly DropDbContext _dbContext;

    public MyClaimsQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<MyClaimResponse>> GetAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var rows = await (
            from claim in _dbContext.Claims
            join drop in _dbContext.Drops on claim.DropId equals drop.Id
            join branch in _dbContext.Branches on drop.BranchId equals branch.Id
            join business in _dbContext.Businesses on branch.BusinessId equals business.Id
            where claim.UserId == userId
            orderby claim.CreatedAt descending
            select new MyClaimResponse(
                claim.Id,
                drop.Id,
                drop.Title,
                business.Name,
                branch.Name,
                claim.Status,
                claim.CreatedAt,
                claim.ExpiresAt,
                claim.RedeemedAt,
                drop.Category,
                business.Id,
                drop.OriginalPrice,
                drop.DealPrice,
                claim.Rating,
                drop.PhotoId,
                claim.Price)
        ).AsNoTracking().Take(MaxClaims).ToListAsync(cancellationToken);

        // The expiration job runs periodically; don't show a lapsed claim as active meanwhile.
        return rows
            .Select(row => row.Status == ClaimStatus.Active && row.ExpiresAt <= now
                ? row with { Status = ClaimStatus.Expired }
                : row)
            .ToList();
    }
}
