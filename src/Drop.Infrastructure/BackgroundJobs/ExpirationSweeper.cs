using Drop.Application.Notifications.Push;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.BackgroundJobs;

public sealed record ExpirationResult(int ExpiredDrops, int ExpiredClaims, int ActivatedDrops = 0, int PlannedDrops = 0);

/// <summary>
/// Moves drops and reservations along their timeline: recurring schedules
/// create their next occurrences, scheduled drops go live at StartsAt, and
/// drops and reservations whose time is up become Expired. Idempotent.
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

    // Occurrences are created a day ahead so they show under "Coming up".
    private static readonly TimeSpan PlanningHorizon = TimeSpan.FromHours(24);

    public async Task<ExpirationResult> RunAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var plannedDrops = await PlanRecurringDropsAsync(now, cancellationToken);

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

        return new ExpirationResult(expiredDrops, expiredClaims, activatedDrops, plannedDrops);
    }

    private async Task<int> PlanRecurringDropsAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        // Only schedules that could publish right now: running, open branch, approved business.
        var schedules = await (
            from schedule in _dbContext.DropSchedules
            join branch in _dbContext.Branches on schedule.BranchId equals branch.Id
            join business in _dbContext.Businesses on branch.BusinessId equals business.Id
            where !schedule.IsPaused && branch.ClosedAt == null && business.Status == BusinessStatus.Approved
            select schedule
        ).ToListAsync(cancellationToken);

        var horizon = now + PlanningHorizon;
        var planned = 0;

        foreach (var schedule in schedules)
        {
            // Missed slots (paused, branch closed, server down) are skipped, not created late.
            var after = schedule.LastOccurrenceAt is { } last && last > now ? last : now;

            for (var next = schedule.NextStartAfter(after); next <= horizon; next = schedule.NextStartAfter(next))
            {
                _dbContext.Drops.Add(schedule.CreateOccurrence(next, now));
                planned++;
            }
        }

        if (planned > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return planned;
    }
}
