using Drop.Application.Users.Badges;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BadgeFactsQuery : IBadgeFactsQuery
{
    private readonly DropDbContext _dbContext;

    public BadgeFactsQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BadgeFacts> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var redeemed = await (
            from claim in _dbContext.Claims
            join drop in _dbContext.Drops on claim.DropId equals drop.Id
            join branch in _dbContext.Branches on drop.BranchId equals branch.Id
            where claim.UserId == userId && claim.Status == ClaimStatus.Redeemed && claim.RedeemedAt != null
            select new RedeemedDropFact(
                drop.Category,
                branch.BusinessId,
                claim.CreatedAt,
                claim.RedeemedAt!.Value,
                drop.OriginalPrice,
                drop.DealPrice)
        ).AsNoTracking().ToListAsync(cancellationToken);

        var rated = await _dbContext.Claims.CountAsync(claim => claim.UserId == userId && claim.Rating != null, cancellationToken);

        return new BadgeFacts(redeemed, rated);
    }
}
