using Drop.Application.Users.Badges;
using Drop.Domain.Drops;

namespace Drop.UnitTests.Domain;

public sealed class BadgeTests
{
    private static readonly Guid Cafe = Guid.NewGuid();

    // 08:30 Turkey time = 05:30 UTC.
    private static RedeemedDropFact Used(DropCategory category, int day, int utcHour = 9, Guid? business = null, decimal? original = null, decimal? deal = null)
    {
        var redeemedAt = new DateTimeOffset(2026, 9, day, utcHour, 30, 0, TimeSpan.Zero);
        return new RedeemedDropFact(category, business ?? Guid.NewGuid(), redeemedAt.AddMinutes(-20), redeemedAt, original, deal);
    }

    private static BadgeResponse Badge(IReadOnlyList<BadgeResponse> badges, string id) => badges.Single(x => x.Id == id);

    [Fact]
    public void NoDrops_ShouldEarnNothing()
    {
        var badges = BadgeService.Evaluate(new BadgeFacts([], 0));

        Assert.All(badges, badge => Assert.False(badge.Earned));
        Assert.All(badges, badge => Assert.Equal(0, badge.Progress));
    }

    [Fact]
    public void Drops_ShouldEarnBadges_WithProgressAndTheMomentTheyWereEarned()
    {
        var facts = new BadgeFacts(
        [
            Used(DropCategory.Coffee, 1, utcHour: 5, business: Cafe, original: 100, deal: 40),
            Used(DropCategory.Coffee, 2, business: Cafe, original: 200, deal: 100),
            Used(DropCategory.Food, 3, utcHour: 19, business: Cafe),
            Used(DropCategory.Dessert, 4),
        ], RatedCount: 2);

        var badges = BadgeService.Evaluate(facts);

        Assert.True(Badge(badges, "first_drop").Earned);
        Assert.Equal(facts.Redeemed[0].RedeemedAt, Badge(badges, "first_drop").EarnedAt);
        Assert.Equal(4, Badge(badges, "regular").Progress);
        Assert.True(Badge(badges, "explorer").Earned);
        // Coffee, Coffee, Food, Dessert: the third distinct category arrives with the fourth drop.
        Assert.Equal(facts.Redeemed[3].RedeemedAt, Badge(badges, "explorer").EarnedAt);
        Assert.True(Badge(badges, "early_bird").Earned);
        Assert.True(Badge(badges, "night_owl").Earned);
        Assert.True(Badge(badges, "loyal").Earned);
        Assert.Equal(160, Badge(badges, "saver").Progress);
        Assert.False(Badge(badges, "saver").Earned);
        Assert.Equal(2, Badge(badges, "critic").Progress);
        Assert.Equal(2, Badge(badges, "coffee_lover").Progress);
    }
}
