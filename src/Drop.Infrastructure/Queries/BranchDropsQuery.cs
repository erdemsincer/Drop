using Drop.Application.Drops.GetBranchDrops;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Queries;

internal sealed class BranchDropsQuery : IBranchDropsQuery
{
    private const int MaxDrops = 50;

    private readonly DropDbContext _dbContext;

    public BranchDropsQuery(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<bool> BranchExistsAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Branches.AnyAsync(x => x.Id == branchId, cancellationToken);
    }

    public async Task<IReadOnlyList<BusinessDropResponse>> GetAsync(
        Guid branchId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.Drops
            .AsNoTracking()
            .Where(drop => drop.BranchId == branchId)
            .OrderByDescending(drop => drop.StartsAt)
            .Take(MaxDrops)
            .Select(drop => new
            {
                drop.Id,
                drop.Title,
                drop.Description,
                drop.MinimumSpend,
                drop.Capacity,
                drop.Duration,
                drop.ClaimDuration,
                drop.Status,
                drop.StartsAt,
                drop.EndsAt,
                drop.Category,
                drop.OriginalPrice,
                drop.DealPrice,
                drop.PhotoId,
                drop.IsMystery,
                drop.Hint,
                ActiveClaimCount = _dbContext.Claims.Count(claim =>
                    claim.DropId == drop.Id &&
                    claim.Status == ClaimStatus.Active &&
                    claim.ExpiresAt > now),
                RedeemedCount = _dbContext.Claims.Count(claim =>
                    claim.DropId == drop.Id &&
                    claim.Status == ClaimStatus.Redeemed),
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new BusinessDropResponse(
                row.Id,
                row.Title,
                row.Description,
                row.MinimumSpend,
                row.Capacity,
                row.ActiveClaimCount,
                row.RedeemedCount,
                Math.Max(0, row.Capacity - row.ActiveClaimCount - row.RedeemedCount),
                (int)row.Duration.TotalMinutes,
                (int)row.ClaimDuration.TotalMinutes,
                EffectiveStatus(row.Status, row.StartsAt, row.EndsAt, now),
                row.StartsAt,
                row.EndsAt,
                row.Category,
                row.OriginalPrice,
                row.DealPrice,
                row.PhotoId,
                row.IsMystery,
                row.Hint))
            .ToList();
    }

    // The sweep runs once a minute; don't show a stale status in between.
    private static DropStatus EffectiveStatus(
        DropStatus status,
        DateTimeOffset? startsAt,
        DateTimeOffset? endsAt,
        DateTimeOffset now)
    {
        if ((status is DropStatus.Active or DropStatus.Scheduled) && endsAt <= now)
            return DropStatus.Expired;

        if (status == DropStatus.Scheduled && startsAt <= now)
            return DropStatus.Active;

        return status;
    }
}
