using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Businesses.Stats;

public sealed class BusinessStatsService
{
    public const int MaxDays = 90;

    // The pilot runs in Turkey: "today" and daily buckets follow the local calendar.
    private static readonly TimeZoneInfo Istanbul = LoadIstanbul();

    private readonly IBusinessStatsQuery _query;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public BusinessStatsService(
        IBusinessStatsQuery query,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _query = query;
        _accessService = accessService;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<BusinessStatsResponse> ExecuteAsync(
        Guid businessId,
        int days,
        CancellationToken cancellationToken = default)
    {
        days = Math.Clamp(days, 1, MaxDays);

        if (!await _accessService.CanManageBusinessAsync(_currentUser.Id, businessId, cancellationToken))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "Only owners and managers can see statistics.");
        }

        var now = _timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, Istanbul).DateTime);
        var firstDay = today.AddDays(1 - days);
        var from = StartOfDay(firstDay);

        var branches = await _query.GetBranchesAsync(businessId, cancellationToken);
        var dropsPublished = await _query.CountDropsStartedAsync(businessId, from, cancellationToken);
        var claims = await _query.GetClaimsAsync(businessId, from, cancellationToken);

        var reserved = claims.Where(claim => claim.CreatedAt >= from).ToList();
        var redeemed = claims.Where(claim => claim.RedeemedAt >= from).ToList();

        var customers = redeemed.Select(claim => claim.UserId).Distinct().ToList();
        var returning = customers.Count == 0
            ? 0
            : await _query.CountPreviousCustomersAsync(businessId, customers, from, cancellationToken);

        var daily = Enumerable.Range(0, days)
            .Select(offset => firstDay.AddDays(offset))
            .Select(day => new DailyStat(
                day,
                reserved.Count(claim => LocalDay(claim.CreatedAt) == day),
                redeemed.Count(claim => LocalDay(claim.RedeemedAt!.Value) == day)))
            .ToList();

        var topDrops = claims
            .GroupBy(claim => claim.DropId)
            .Select(group => new TopDropStat(
                group.Key,
                group.First().DropTitle,
                group.First().BranchName,
                group.Count(claim => claim.CreatedAt >= from),
                group.Count(claim => claim.RedeemedAt >= from)))
            .OrderByDescending(drop => drop.Redemptions)
            .ThenByDescending(drop => drop.Reservations)
            .Take(5)
            .ToList();

        var branchStats = branches
            .Select(branch => new BranchStat(
                branch.BranchId,
                branch.Name,
                redeemed.Count(claim => claim.BranchId == branch.BranchId)))
            .OrderByDescending(branch => branch.Redemptions)
            .ToList();

        return new BusinessStatsResponse(
            days,
            dropsPublished,
            reserved.Count,
            redeemed.Count,
            reserved.Count == 0 ? 0 : Math.Round((double)reserved.Count(claim => claim.RedeemedAt is not null) / reserved.Count, 3),
            customers.Count,
            returning,
            daily,
            topDrops,
            branchStats);
    }

    private static DateOnly LocalDay(DateTimeOffset moment) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(moment, Istanbul).DateTime);

    private static DateTimeOffset StartOfDay(DateOnly day)
    {
        var local = day.ToDateTime(TimeOnly.MinValue);
        // Npgsql only accepts UTC offsets for timestamptz parameters.
        return new DateTimeOffset(local, Istanbul.GetUtcOffset(local)).ToUniversalTime();
    }

    // Slim container images may ship without tzdata; Turkey has been fixed at UTC+3 since 2016.
    private static TimeZoneInfo LoadIstanbul()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return TimeZoneInfo.CreateCustomTimeZone("Europe/Istanbul", TimeSpan.FromHours(3), "Istanbul", "Istanbul");
        }
    }
}
