using Drop.Application.Authentication;
using Drop.Domain.Common;
using Drop.Domain.Drops;

namespace Drop.Application.Users.Badges;

/// <summary>One used drop, as much as badges need to know about it.</summary>
public sealed record RedeemedDropFact(
    DropCategory Category,
    Guid BusinessId,
    DateTimeOffset ClaimedAt,
    DateTimeOffset RedeemedAt,
    decimal? OriginalPrice,
    decimal? DealPrice);

public sealed record BadgeFacts(IReadOnlyList<RedeemedDropFact> Redeemed, int RatedCount);

public interface IBadgeFactsQuery
{
    Task<BadgeFacts> GetAsync(Guid userId, CancellationToken cancellationToken = default);
}

/// <param name="Id">Stable key; the app maps it to a name and an icon.</param>
/// <param name="EarnedAt">When the threshold was crossed, for "new badge!" moments; null if not earned.</param>
public sealed record BadgeResponse(
    string Id,
    bool Earned,
    int Progress,
    int Target,
    DateTimeOffset? EarnedAt);

/// <summary>Achievements computed from the customer's used drops. Nothing is stored; rules can change freely.</summary>
public sealed class BadgeService
{
    private readonly IBadgeFactsQuery _query;
    private readonly ICurrentUser _currentUser;

    public BadgeService(IBadgeFactsQuery query, ICurrentUser currentUser)
    {
        _query = query;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<BadgeResponse>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var facts = await _query.GetAsync(_currentUser.Id, cancellationToken);
        return Evaluate(facts);
    }

    public static IReadOnlyList<BadgeResponse> Evaluate(BadgeFacts facts)
    {
        var used = facts.Redeemed.OrderBy(x => x.RedeemedAt).ToList();

        int LocalHour(RedeemedDropFact fact) => TurkeyTime.ToLocal(fact.RedeemedAt).Hour;

        return
        [
            Count("first_drop", used, 1),
            Count("regular", used, 5),
            Count("legend", used, 15),
            Count("coffee_lover", used.Where(x => x.Category == DropCategory.Coffee).ToList(), 5),
            Count("foodie", used.Where(x => x.Category == DropCategory.Food).ToList(), 5),
            Count("sweet_tooth", used.Where(x => x.Category == DropCategory.Dessert).ToList(), 3),
            Distinct("explorer", used, x => x.Category, 3),
            Count("early_bird", used.Where(x => LocalHour(x) < 10).ToList(), 1),
            Count("night_owl", used.Where(x => LocalHour(x) >= 21).ToList(), 1),
            // Used within five minutes of catching it.
            Count("lightning", used.Where(x => x.RedeemedAt - x.ClaimedAt <= TimeSpan.FromMinutes(5)).ToList(), 1),
            Loyal(used, 3),
            Saver(used, 500),
            new BadgeResponse("critic", facts.RatedCount >= 5, Math.Min(facts.RatedCount, 5), 5, null),
        ];
    }

    private static BadgeResponse Count(string id, IReadOnlyList<RedeemedDropFact> matching, int target) =>
        new(id, matching.Count >= target, Math.Min(matching.Count, target), target,
            matching.Count >= target ? matching[target - 1].RedeemedAt : null);

    private static BadgeResponse Distinct<TKey>(string id, IReadOnlyList<RedeemedDropFact> used, Func<RedeemedDropFact, TKey> key, int target)
    {
        var seen = new HashSet<TKey>();
        DateTimeOffset? earnedAt = null;

        foreach (var fact in used)
        {
            if (seen.Add(key(fact)) && seen.Count == target) earnedAt = fact.RedeemedAt;
        }

        return new BadgeResponse(id, earnedAt is not null, Math.Min(seen.Count, target), target, earnedAt);
    }

    /// <summary>The same business, three times.</summary>
    private static BadgeResponse Loyal(IReadOnlyList<RedeemedDropFact> used, int target)
    {
        var best = used.GroupBy(x => x.BusinessId).Select(group => group.ToList()).MaxBy(group => group.Count);
        var count = best?.Count ?? 0;
        return new BadgeResponse("loyal", count >= target, Math.Min(count, target), target,
            count >= target ? best![target - 1].RedeemedAt : null);
    }

    private static BadgeResponse Saver(IReadOnlyList<RedeemedDropFact> used, decimal target)
    {
        var total = 0m;
        DateTimeOffset? earnedAt = null;

        foreach (var fact in used)
        {
            if (fact.OriginalPrice is { } original && fact.DealPrice is { } deal) total += original - deal;
            if (earnedAt is null && total >= target) earnedAt = fact.RedeemedAt;
        }

        return new BadgeResponse("saver", earnedAt is not null, (int)Math.Min(total, target), (int)target, earnedAt);
    }
}
