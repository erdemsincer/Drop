using Drop.Domain.Drops;

namespace Drop.UnitTests.Domain;

public sealed class DropTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 23, 12, 0, 0, TimeSpan.Zero);

    private static Drop.Domain.Drops.Drop NewLiveDrop()
    {
        var drop = new Drop.Domain.Drops.Drop(
            Guid.NewGuid(), "Test", null, null, 5, TimeSpan.FromHours(1), TimeSpan.FromMinutes(15));
        drop.Activate(Now);
        return drop;
    }

    [Fact]
    public void End_ShouldExpireAndCloseNow()
    {
        var drop = NewLiveDrop();

        drop.End(Now.AddMinutes(10));

        Assert.Equal(DropStatus.Expired, drop.Status);
        Assert.Equal(Now.AddMinutes(10), drop.EndsAt);
        Assert.False(drop.IsLive(Now.AddMinutes(10)));
    }

    [Fact]
    public void Cancel_ShouldRejectDropThatAlreadyEnded()
    {
        var drop = NewLiveDrop();

        var error = Assert.Throws<DropDomainException>(() => drop.Cancel(Now.AddHours(2)));

        Assert.Equal("drop.not_active", error.Code);
    }

    [Fact]
    public void Activate_ShouldRejectNonDraft()
    {
        var drop = NewLiveDrop();

        var error = Assert.Throws<DropDomainException>(() => drop.Activate(Now));

        Assert.Equal("drop.not_draft", error.Code);
    }
}
