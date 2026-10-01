using Drop.Application.Users.Stats;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class MyStatsQuery : IMyStatsQuery
{
    private readonly DropDbContext _dbContext;

    public MyStatsQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<MyStatsResponse> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var claims = _dbContext.Claims.AsNoTracking().Where(claim => claim.UserId == userId);

        var claimed = await claims.CountAsync(cancellationToken);
        var redeemed = await claims.CountAsync(claim => claim.Status == ClaimStatus.Redeemed, cancellationToken);

        var saved = await (
            from claim in claims
            join drop in _dbContext.Drops on claim.DropId equals drop.Id
            where claim.Status == ClaimStatus.Redeemed && drop.OriginalPrice != null && (claim.Price != null || drop.DealPrice != null)
            // The locked-in price wins: on a falling-price drop it's what they actually paid.
            select drop.OriginalPrice!.Value - (claim.Price ?? drop.DealPrice!.Value)
        ).SumAsync(cancellationToken);

        return new MyStatsResponse(claimed, redeemed, saved);
    }
}
