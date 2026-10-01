using Drop.Domain.Drops;

namespace Drop.UnitTests.Domain;

public sealed class FallingPriceTests
{
    private static readonly DateTimeOffset Start = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);

    private static Drop.Domain.Drops.Drop Falling(decimal start = 100m, decimal floor = 40m)
    {
        var drop = new Drop.Domain.Drops.Drop(Guid.NewGuid(), "Pizza", null, null, 10, TimeSpan.FromMinutes(60), TimeSpan.FromMinutes(15));
        drop.SetPricing(120m, floor);
        drop.SetFallingPrice(start);
        drop.Activate(Start);
        return drop;
    }

    [Fact]
    public void Price_ShouldFallMinuteByMinute_FromStartToFloor()
    {
        var drop = Falling();

        Assert.Equal(100m, drop.PriceAt(Start));
        Assert.Equal(100m, drop.PriceAt(Start.AddSeconds(59)));   // whole minutes only
        Assert.Equal(99m, drop.PriceAt(Start.AddMinutes(1)));
        Assert.Equal(70m, drop.PriceAt(Start.AddMinutes(30)));
        Assert.Equal(40m, drop.PriceAt(Start.AddMinutes(60)));
        Assert.Equal(40m, drop.PriceAt(Start.AddMinutes(90)));   // never below the floor
    }

    [Fact]
    public void Price_ShouldBeTheDealPrice_WhenNotFalling()
    {
        var drop = new Drop.Domain.Drops.Drop(Guid.NewGuid(), "Kahve", null, null, 10, TimeSpan.FromMinutes(60), TimeSpan.FromMinutes(15));
        drop.SetPricing(80m, 50m);
        drop.Activate(Start);

        Assert.False(drop.IsFallingPrice);
        Assert.Equal(50m, drop.PriceAt(Start.AddMinutes(30)));
    }

    [Theory]
    [InlineData(40)]   // not above the floor
    [InlineData(150)]  // above the usual price
    public void StartPrice_ShouldSitBetweenFloorAndUsualPrice(int start)
    {
        var drop = new Drop.Domain.Drops.Drop(Guid.NewGuid(), "Pizza", null, null, 10, TimeSpan.FromMinutes(60), TimeSpan.FromMinutes(15));
        drop.SetPricing(120m, 40m);

        var error = Assert.Throws<DropDomainException>(() => drop.SetFallingPrice(start));
        Assert.Equal("drop.start_price_invalid", error.Code);
    }

    [Fact]
    public void ClearingPrices_ShouldClearTheFall()
    {
        var drop = Falling();

        drop.SetPricing(null, null);

        Assert.False(drop.IsFallingPrice);
    }
}
