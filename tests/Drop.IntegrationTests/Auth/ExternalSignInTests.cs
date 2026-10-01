using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Application.Authentication.External;
using Drop.Domain.Users;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Auth;

public sealed class ExternalSignInTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private const string Password = "Passw0rd!123";

    private readonly DropApiFactory _factory;

    public ExternalSignInTests(DropApiFactory factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        await _factory.InitializeDatabaseAsync();
    }

    public Task DisposeAsync()
    {
        return Task.CompletedTask;
    }

    [Fact]
    public async Task Apple_FirstSignIn_ShouldCreateVerifiedPasswordlessUser_ThenSignInAgain()
    {
        var email = NewEmail();
        var subject = Guid.NewGuid().ToString("N");
        var anonymous = _factory.CreateClient();

        // Apple hands the name to the app only once; the app forwards it.
        var first = await anonymous.PostAsJsonAsync("/api/auth/apple", new
        {
            idToken = Token(ExternalProvider.Apple, subject, email),
            firstName = "Elma",
            lastName = "Kullanıcı",
        });
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("refreshToken").GetString().Should().NotBeNullOrEmpty();

        var userId = await UserIdAsync(email);
        var me = await Client(userId).GetFromJsonAsync<JsonElement>("/api/users/me");
        me.GetProperty("firstName").GetString().Should().Be("Elma");
        me.GetProperty("emailVerified").GetBoolean().Should().BeTrue();
        me.GetProperty("hasPassword").GetBoolean().Should().BeFalse();

        // Later sign-ins carry no name (and could even carry no e-mail): the subject finds the user.
        var again = await anonymous.PostAsJsonAsync("/api/auth/apple", new
        {
            idToken = Token(ExternalProvider.Apple, subject, email: null),
        });
        again.StatusCode.Should().Be(HttpStatusCode.OK);
        (await UserIdAsync(email)).Should().Be(userId);

        // No password to match, so e-mail + password sign-in stays closed.
        var login = await anonymous.PostAsJsonAsync("/api/auth/login", new { email, password = "anything-at-all" });
        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Google_WithExistingEmail_ShouldLinkToThatAccount()
    {
        var email = NewEmail();
        var anonymous = _factory.CreateClient();

        (await anonymous.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = Password,
            firstName = "Var",
            lastName = "Olan",
        })).EnsureSuccessStatusCode();
        var userId = await UserIdAsync(email);

        var google = await anonymous.PostAsJsonAsync("/api/auth/google", new
        {
            idToken = Token(ExternalProvider.Google, Guid.NewGuid().ToString("N"), email.ToUpperInvariant()),
        });
        google.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        (await dbContext.Users.CountAsync(x => x.Email == email)).Should().Be(1);
        (await dbContext.ExternalLogins.SingleAsync(x => x.UserId == userId)).Provider.Should().Be(ExternalProvider.Google);

        var me = await Client(userId).GetFromJsonAsync<JsonElement>("/api/users/me");
        me.GetProperty("firstName").GetString().Should().Be("Var");
        me.GetProperty("emailVerified").GetBoolean().Should().BeTrue();
        me.GetProperty("hasPassword").GetBoolean().Should().BeTrue();

        // The password keeps working next to Google.
        (await anonymous.PostAsJsonAsync("/api/auth/login", new { email, password = Password }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UnverifiedEmail_ShouldNotLinkOrCreate()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/google", new
        {
            idToken = Token(ExternalProvider.Google, Guid.NewGuid().ToString("N"), NewEmail(), emailVerified: false),
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await response.Content.ReadAsStringAsync()).Should().Contain("auth.external_email_missing");
    }

    [Fact]
    public async Task InvalidToken_ShouldBeRejected()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/apple", new { idToken = "not-a-real-token" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await response.Content.ReadAsStringAsync()).Should().Contain("auth.invalid_external_token");
    }

    [Fact]
    public async Task PasswordlessUser_ShouldSetPassword_AndDeleteWithoutOne()
    {
        var email = NewEmail();
        var anonymous = _factory.CreateClient();

        (await anonymous.PostAsJsonAsync("/api/auth/apple", new
        {
            idToken = Token(ExternalProvider.Apple, Guid.NewGuid().ToString("N"), email),
        })).EnsureSuccessStatusCode();
        var userId = await UserIdAsync(email);
        var me = Client(userId);

        // No name shared at all: a placeholder the user can edit.
        (await me.GetFromJsonAsync<JsonElement>("/api/users/me")).GetProperty("firstName").GetString().Should().Be("Drop");

        // First password: nothing to confirm.
        (await me.PostAsJsonAsync("/api/users/me/password", new { currentPassword = "", newPassword = Password }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await anonymous.PostAsJsonAsync("/api/auth/login", new { email, password = Password }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        // From now on the password guards changes and deletion like for anyone else.
        (await me.PostAsJsonAsync("/api/users/me/password", new { currentPassword = "", newPassword = "An0ther-pass!" }))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task PasswordlessUser_ShouldDeleteAccountWithoutPassword()
    {
        var email = NewEmail();

        (await _factory.CreateClient().PostAsJsonAsync("/api/auth/apple", new
        {
            idToken = Token(ExternalProvider.Apple, Guid.NewGuid().ToString("N"), email),
        })).EnsureSuccessStatusCode();
        var userId = await UserIdAsync(email);

        var deleted = await Client(userId).PostAsJsonAsync("/api/users/me/delete", new { password = (string?)null });
        deleted.IsSuccessStatusCode.Should().BeTrue();

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        (await dbContext.Users.AnyAsync(x => x.Id == userId)).Should().BeFalse();
        (await dbContext.ExternalLogins.AnyAsync(x => x.UserId == userId)).Should().BeFalse();
    }

    private static string NewEmail() => $"ext-{Guid.NewGuid():N}@drop.test";

    private string Token(ExternalProvider provider, string subject, string? email, bool emailVerified = true) =>
        _factory.Services.GetRequiredService<FakeExternalIdentityVerifier>()
            .Issue(provider, new ExternalIdentity(subject, email, emailVerified, null, null));

    private async Task<Guid> UserIdAsync(string email)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        return await dbContext.Users.Where(x => x.Email == email).Select(x => x.Id).SingleAsync();
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
