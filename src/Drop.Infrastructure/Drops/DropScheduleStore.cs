using Drop.Application.Drops.Schedules;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Drops;

internal sealed class DropScheduleStore : IDropScheduleStore
{
    private readonly DropDbContext _dbContext;

    public DropScheduleStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public void Add(DropSchedule schedule) => _dbContext.DropSchedules.Add(schedule);

    public Task<DropSchedule?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.DropSchedules.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<DropSchedule>> ListByBranchAsync(Guid branchId, CancellationToken cancellationToken = default) =>
        await _dbContext.DropSchedules
            .AsNoTracking()
            .Where(x => x.BranchId == branchId)
            .OrderBy(x => x.StartTime)
            .ToListAsync(cancellationToken);

    public async Task DeleteAsync(DropSchedule schedule, DateTimeOffset now, CancellationToken cancellationToken = default)
    {
        // Already announced under "Coming up" but not started: withdraw them with the schedule.
        var upcoming = await _dbContext.Drops
            .Where(drop => drop.ScheduleId == schedule.Id && drop.Status == DropStatus.Scheduled && drop.StartsAt > now)
            .ToListAsync(cancellationToken);

        foreach (var drop in upcoming)
        {
            drop.Cancel(now);
        }

        _dbContext.DropSchedules.Remove(schedule);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
