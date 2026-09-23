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

    public ExpirationSweeper(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ExpirationResult> RunAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        // Scheduled drops whose start has come go live (unless their window already passed).
        var activatedDrops = await _dbContext.Drops
            .Where(drop => drop.Status == DropStatus.Scheduled && drop.StartsAt <= now && drop.EndsAt > now)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(drop => drop.Status, DropStatus.Active),
                cancellationToken);

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
