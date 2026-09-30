using Drop.Domain.Users;

namespace Drop.UnitTests.Domain;

public sealed class UserTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 30, 12, 0, 0, TimeSpan.Zero);

    private static User NewUser() => new("Ayse@Drop.Test", "hash", "Ayşe", "Yılmaz", Now);

    [Fact]
    public void NewUser_ShouldStartUnverified()
    {
        var user = NewUser();

        Assert.False(user.IsEmailVerified);
        Assert.Equal("ayse@drop.test", user.Email);
    }

    [Fact]
    public void MarkEmailVerified_ShouldKeepTheFirstTimestamp()
    {
        var user = NewUser();

        user.MarkEmailVerified(Now);
        user.MarkEmailVerified(Now.AddDays(1));

        Assert.True(user.IsEmailVerified);
        Assert.Equal(Now, user.EmailVerifiedAt);
    }

    [Fact]
    public void Rename_ShouldTrim_AndRejectBlankNames()
    {
        var user = NewUser();

        user.Rename("  Ayşe ", " Demir ");
        Assert.Equal("Ayşe", user.FirstName);
        Assert.Equal("Demir", user.LastName);

        Assert.Throws<ArgumentException>(() => user.Rename(" ", "Demir"));
        Assert.Equal("Ayşe", user.FirstName);
    }
}
