using Drop.Domain.Branches;

namespace Drop.UnitTests.Domain;

public sealed class BranchTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 30, 12, 0, 0, TimeSpan.Zero);

    private static Branch NewBranch() => new(Guid.NewGuid(), "Merkez", new Location(37.0, 35.3));

    [Fact]
    public void Close_ThenReopen_ShouldToggleClosedState()
    {
        var branch = NewBranch();

        branch.Close(Now);
        Assert.True(branch.IsClosed);
        Assert.Equal(Now, branch.ClosedAt);

        branch.Reopen();
        Assert.False(branch.IsClosed);
        Assert.Null(branch.ClosedAt);
    }

    [Fact]
    public void Close_ShouldReject_WhenAlreadyClosed()
    {
        var branch = NewBranch();
        branch.Close(Now);

        var error = Assert.Throws<BranchDomainException>(() => branch.Close(Now.AddHours(1)));

        Assert.Equal("branch.already_closed", error.Code);
        Assert.Equal(Now, branch.ClosedAt);
    }

    [Fact]
    public void Reopen_ShouldReject_WhenOpen()
    {
        var error = Assert.Throws<BranchDomainException>(() => NewBranch().Reopen());

        Assert.Equal("branch.not_closed", error.Code);
    }
}
