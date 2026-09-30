using Drop.Domain.Drops;

namespace Drop.UnitTests.Domain;

public sealed class ClaimTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 23, 12, 0, 0, TimeSpan.Zero);

    private static Claim NewClaim(TimeSpan? duration = null) =>
        new(Guid.NewGuid(), Guid.NewGuid(), Now, duration ?? TimeSpan.FromMinutes(15));

    [Fact]
    public void Redeem_ShouldMarkRedeemed_WhenActiveAndInTime()
    {
        var claim = NewClaim();

        claim.Redeem(Now.AddMinutes(5));

        Assert.Equal(ClaimStatus.Redeemed, claim.Status);
        Assert.Equal(Now.AddMinutes(5), claim.RedeemedAt);
    }

    [Fact]
    public void Redeem_ShouldRejectAsExpired_AtExactExpiry()
    {
        var claim = NewClaim();

        var error = Assert.Throws<ClaimDomainException>(() => claim.Redeem(claim.ExpiresAt));

        Assert.Equal("claim.expired", error.Code);
        Assert.Null(claim.RedeemedAt);
    }

    [Fact]
    public void Redeem_ShouldRejectAsNotActive_WhenAlreadyRedeemed()
    {
        var claim = NewClaim();
        claim.Redeem(Now);

        var error = Assert.Throws<ClaimDomainException>(() => claim.Redeem(Now.AddMinutes(1)));

        Assert.Equal("claim.not_active", error.Code);
    }

    [Fact]
    public void Redeem_ShouldRejectAsNotActive_WhenCancelled()
    {
        var claim = NewClaim();
        claim.Cancel();

        var error = Assert.Throws<ClaimDomainException>(() => claim.Redeem(Now.AddMinutes(1)));

        Assert.Equal(ClaimStatus.Cancelled, claim.Status);
        Assert.Equal("claim.not_active", error.Code);
    }

    [Fact]
    public void Cancel_ShouldNotTouchRedeemedClaim()
    {
        var claim = NewClaim();
        claim.Redeem(Now);

        claim.Cancel();

        Assert.Equal(ClaimStatus.Redeemed, claim.Status);
    }

    [Fact]
    public void Withdraw_ShouldCancel_WhenActiveAndInTime()
    {
        var claim = NewClaim();

        claim.Withdraw(Now.AddMinutes(1));

        Assert.Equal(ClaimStatus.Cancelled, claim.Status);
    }

    [Fact]
    public void Withdraw_ShouldRejectAsExpired_AfterExpiry()
    {
        var claim = NewClaim();

        var error = Assert.Throws<ClaimDomainException>(() => claim.Withdraw(claim.ExpiresAt));

        Assert.Equal("claim.expired", error.Code);
        Assert.Equal(ClaimStatus.Active, claim.Status);
    }

    [Fact]
    public void Withdraw_ShouldRejectAsNotActive_WhenRedeemed()
    {
        var claim = NewClaim();
        claim.Redeem(Now);

        var error = Assert.Throws<ClaimDomainException>(() => claim.Withdraw(Now.AddMinutes(1)));

        Assert.Equal("claim.not_active", error.Code);
        Assert.Equal(ClaimStatus.Redeemed, claim.Status);
    }
}
