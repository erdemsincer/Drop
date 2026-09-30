namespace Drop.Application.Businesses.Stats;

/// <summary>
/// How the business did over the last <see cref="Days"/> days (Istanbul calendar days).
/// Reservations are counted when made, redemptions when used.
/// </summary>
public sealed record BusinessStatsResponse(
    int Days,
    int DropsPublished,
    int Reservations,
    int Redemptions,
    /// <summary>Redemptions ÷ reservations made in the period, 0–1.</summary>
    double RedemptionRate,
    int UniqueCustomers,
    int ReturningCustomers,
    IReadOnlyList<DailyStat> Daily,
    IReadOnlyList<TopDropStat> TopDrops,
    IReadOnlyList<BranchStat> Branches);

public sealed record DailyStat(DateOnly Date, int Reservations, int Redemptions);

public sealed record TopDropStat(Guid DropId, string Title, string BranchName, int Reservations, int Redemptions);

public sealed record BranchStat(Guid BranchId, string Name, int Redemptions);

/// <summary>Raw rows the stats are computed from.</summary>
public sealed record StatsClaimRow(
    Guid UserId,
    Guid DropId,
    string DropTitle,
    Guid BranchId,
    string BranchName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? RedeemedAt);

public sealed record StatsBranchRow(Guid BranchId, string Name);

public interface IBusinessStatsQuery
{
    Task<IReadOnlyList<StatsBranchRow>> GetBranchesAsync(Guid businessId, CancellationToken cancellationToken = default);

    Task<int> CountDropsStartedAsync(Guid businessId, DateTimeOffset since, CancellationToken cancellationToken = default);

    /// <summary>Claims created or redeemed since <paramref name="since"/>.</summary>
    Task<IReadOnlyList<StatsClaimRow>> GetClaimsAsync(Guid businessId, DateTimeOffset since, CancellationToken cancellationToken = default);

    /// <summary>Of <paramref name="userIds"/>, those who redeemed at this business before <paramref name="before"/>.</summary>
    Task<int> CountPreviousCustomersAsync(
        Guid businessId,
        IReadOnlyCollection<Guid> userIds,
        DateTimeOffset before,
        CancellationToken cancellationToken = default);
}
