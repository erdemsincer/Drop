using Drop.Application.Notifications.Push;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.BackgroundJobs;

public sealed record ExpirationResult(int ExpiredDrops, int ExpiredClaims, int ActivatedDrops = 0);

/// <summary>
/// Moves drops and reservations along their timeline: scheduled drops go live
/// at StartsAt; drops and reservations whose time is up become Expired.
/// Idempotent and set-based.
/// </summary>
public sealed class ExpirationSweeper
{
    private readonly DropDbContext _dbContext;
    private readonly IDropLiveNotifier _dropLiveNotifier;

    public ExpirationSweeper(DropDbContext dbContext, IDropLiveNotifier dropLiveNotifier)
    {
        _dbContext = dbContext;
        _dropLiveNotifier = dropLiveNotifier;
    }

    public async Task<ExpirationResult> RunAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        // Scheduled drops whose start has come go live (unless their window already passed).
        var dueIds = await _dbContext.Drops
            .Where(drop => drop.Status == DropStatus.Scheduled && drop.StartsAt <= now && drop.EndsAt > now)
            .Select(drop => drop.Id)
            .ToListAsync(cancellationToken);

        // Status is re-checked so a drop cancelled in the meantime isn't revived.
        var activatedDrops = dueIds.Count == 0
            ? 0
            : await _dbContext.Drops
                .Where(drop => dueIds.Contains(drop.Id) && drop.Status == DropStatus.Scheduled)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(drop => drop.Status, DropStatus.Active),
                    cancellationToken);

        foreach (var dropId in dueIds)
        {
            // The dispatcher skips any that didn't actually go live.
            _dropLiveNotifier.Enqueue(dropId);
        }

        var expiredDrops = await _dbContext.Drops
            .Where(drop =>
                (drop.Status == DropStatus.Active || drop.Status == DropStatus.Scheduled) &&
                drop.EndsAt <= now)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(drop => drop.Status, DropStatus.Expired),
                cancellationToken);

        var expiredClaims = await _dbContext.Claims
            .Where(claim => claim.Status == ClaimStatus.Active && claim.ExpiresAt <= now)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(claim => claim.Status, ClaimStatus.Expired),
                cancellationToken);

        return new ExpirationResult(expiredDrops, expiredClaims, activatedDrops);
    }
}
