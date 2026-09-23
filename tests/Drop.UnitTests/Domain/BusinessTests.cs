using Drop.Domain.Businesses;

namespace Drop.UnitTests.Domain;

public sealed class BusinessTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 23, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void NewBusiness_ShouldBePending_AndUnableToPublish()
    {
        var business = new Business("Kafe", Now);

        Assert.Equal(BusinessStatus.Pending, business.Status);
        Assert.False(business.CanPublishDrops);
    }

    [Fact]
    public void Approve_ShouldAllowPublishing()
    {
        var business = new Business("Kafe", Now);

        business.Approve(Now.AddHours(1));

        Assert.True(business.CanPublishDrops);
        Assert.Equal(Now.AddHours(1), business.StatusChangedAt);
    }

    [Fact]
    public void Reject_ShouldOnlyApplyToPending_AndKeepReason()
    {
        var business = new Business("Kafe", Now);

        business.Reject("  Belge eksik  ", Now);

        Assert.Equal(BusinessStatus.Rejected, business.Status);
        Assert.Equal("Belge eksik", business.StatusReason);
        Assert.Throws<BusinessDomainException>(() => business.Reject("tekrar", Now));
    }

    [Fact]
    public void Suspend_ShouldRequireApproved_AndApproveReinstates()
    {
        var business = new Business("Kafe", Now);

        Assert.Throws<BusinessDomainException>(() => business.Suspend("sebep", Now));

        business.Approve(Now);
        business.Suspend("Şikayet", Now);
        Assert.False(business.CanPublishDrops);

        business.Approve(Now);
        Assert.True(business.CanPublishDrops);
        Assert.Null(business.StatusReason);
    }

    [Fact]
    public void Reject_ShouldRequireReason()
    {
        var business = new Business("Kafe", Now);

        Assert.Throws<ArgumentException>(() => business.Reject("   ", Now));
    }
}
