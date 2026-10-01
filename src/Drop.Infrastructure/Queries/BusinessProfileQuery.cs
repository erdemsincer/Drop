using Drop.Application.Drops;
using Drop.Application.Businesses.Profile;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BusinessProfileQuery : IBusinessProfileQuery
{
    private readonly DropDbContext _dbContext;

    public BusinessProfileQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BusinessProfileResponse?> GetAsync(
        Guid businessId,
        Guid viewerId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var business = await _dbContext.Businesses
            .AsNoTracking()
            .Where(x => x.Id == businessId && x.Status == BusinessStatus.Approved)
            .Select(x => new { x.Id, x.Name })
            .SingleOrDefaultAsync(cancellationToken);

        if (business is null)
        {
            return null;
        }

        var branches = await _dbContext.Branches
            .AsNoTracking()
            .Where(x => x.BusinessId == businessId && x.ClosedAt == null)
            .OrderBy(x => x.Name)
            .Select(x => new BusinessProfileBranch(x.Id, x.Name, x.Location.Latitude, x.Location.Longitude))
            .ToListAsync(cancellationToken);

        var followerCount = await _dbContext.BusinessFollows.CountAsync(x => x.BusinessId == businessId, cancellationToken);
        var isFollowing = await _dbContext.BusinessFollows.AnyAsync(
            x => x.BusinessId == businessId && x.UserId == viewerId,
            cancellationToken);

        var businessClaims =
            from claim in _dbContext.Claims
            join drop in _dbContext.Drops on claim.DropId equals drop.Id
            join branch in _dbContext.Branches on drop.BranchId equals branch.Id
            where branch.BusinessId == businessId
            select claim;

        var ratings = await businessClaims
            .Where(claim => claim.Rating != null)
            .GroupBy(_ => 1)
            .Select(group => new { Average = group.Average(claim => (double)claim.Rating!.Value), Count = group.Count() })
            .SingleOrDefaultAsync(cancellationToken);

        var redeemedCount = await businessClaims.CountAsync(claim => claim.Status == ClaimStatus.Redeemed, cancellationToken);

        var drops = await (
            from drop in _dbContext.Drops
            join branch in _dbContext.Branches on drop.BranchId equals branch.Id
            where branch.BusinessId == businessId
                  && branch.ClosedAt == null
                  && drop.EndsAt > now
                  && (drop.Status == DropStatus.Active || drop.Status == DropStatus.Scheduled)
            orderby drop.StartsAt
            select new
            {
                drop.Id,
                drop.BranchId,
                BranchName = branch.Name,
                drop.Title,
                drop.Category,
                drop.Capacity,
                drop.Status,
                StartsAt = drop.StartsAt!.Value,
                EndsAt = drop.EndsAt!.Value,
                drop.OriginalPrice,
                drop.DealPrice,
                drop.PhotoId,
                drop.IsMystery,
                drop.StartPrice,
                Taken = _dbContext.Claims.Count(claim =>
                    claim.DropId == drop.Id
                    && (claim.Status == ClaimStatus.Redeemed || (claim.Status == ClaimStatus.Active && claim.ExpiresAt > now))),
            }
        ).AsNoTracking().Take(50).ToListAsync(cancellationToken);

        var mapped = drops.Select(row => (
            Live: row.Status == DropStatus.Active && row.StartsAt <= now,
            Drop: new BusinessProfileDrop(
                row.Id,
                row.BranchId,
                row.BranchName,
                row.Title,
                row.Category.ToString(),
                row.Capacity,
                Math.Max(0, row.Capacity - row.Taken),
                row.StartsAt,
                row.EndsAt,
                row.OriginalPrice,
                row.DealPrice,
                row.PhotoId,
                row.IsMystery,
                row.StartPrice))).ToList();

        return new BusinessProfileResponse(
            business.Id,
            business.Name,
            followerCount,
            isFollowing,
            ratings is null ? null : Math.Round(ratings.Average, 1),
            ratings?.Count ?? 0,
            redeemedCount,
            branches,
            mapped.Where(x => x.Live).Select(x => MysteryMask.Apply(x.Drop)).ToList(),
            mapped.Where(x => !x.Live).Select(x => MysteryMask.Apply(x.Drop)).ToList());
    }
}
