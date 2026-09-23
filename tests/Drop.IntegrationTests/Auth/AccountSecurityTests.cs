using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Auth;

public sealed class AccountSecurityTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private const string Password = "Passw0rd!123";

    private readonly DropApiFactory _factory;

    public AccountSecurityTests(DropApiFactory factory)
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
    public async Task ResetPassword_ShouldChangePassword_AndSignOutEverywhere()
    {
        var client = _factory.CreateClient();
        var (email, refreshToken) = await RegisterAndLoginAsync(client);

        (await client.PostAsJsonAsync("/api/auth/forgot-password", new { email }))
            .StatusCode.Should().Be(HttpStatusCode.Accepted);

        var code = CodeSentTo(email);

        var reset = await client.PostAsJsonAsync(
            "/api/auth/reset-password",
            new { email, code, newPassword = "N3wPassword!" });
        reset.StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.PostAsJsonAsync("/api/auth/login", new { email, password = "N3wPassword!" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // One-time: the same code can't be reused.
        (await client.PostAsJsonAsync("/api/auth/reset-password", new { email, code, newPassword = "Another1!" }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ForgotPassword_ShouldAccept_UnknownEmailWithoutSending()
    {
        var email = $"ghost-{Guid.NewGuid():N}@drop.test";

        var response = await _factory.CreateClient()
            .PostAsJsonAsync("/api/auth/forgot-password", new { email });

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        Emails.LastBodyTo(email).Should().BeNull();
    }

    [Fact]
    public async Task ResetPassword_ShouldLockCode_AfterTooManyWrongGuesses()
    {
        var client = _factory.CreateClient();
        var (email, _) = await RegisterAndLoginAsync(client);

        await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        var code = CodeSentTo(email);
        var wrong = code == "000000" ? "111111" : "000000";

        for (var i = 0; i < 5; i++)
        {
            (await client.PostAsJsonAsync("/api/auth/reset-password", new { email, code = wrong, newPassword = "N3wPassword!" }))
                .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        var right = await client.PostAsJsonAsync("/api/auth/reset-password", new { email, code, newPassword = "N3wPassword!" });

        right.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await right.Content.ReadAsStringAsync()).Should().Contain("auth.invalid_reset_code");
    }

    [Fact]
    public async Task DeleteAccount_ShouldRemoveUserAndOwnedBusiness()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var client = _factory.CreateClient();
        var (email, _) = await RegisterAndLoginAsync(client);
        var userId = await UserIdOfAsync(email);

        var owner = _factory.CreateClient();
        owner.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());

        var created = await owner.PostAsJsonAsync("/api/businesses", new { name = "Silinecek" });
        var businessId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        // Holding a place elsewhere must be released too.
        await IntegrationTestData.CreateClaimAsync(_factory, scenario.DropId, userId, DateTimeOffset.UtcNow, TimeSpan.FromMinutes(15));

        var delete = await owner.PostAsJsonAsync("/api/users/me/delete", new { password = Password });
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();

        (await dbContext.Users.AnyAsync(x => x.Id == userId)).Should().BeFalse();
        (await dbContext.Businesses.AnyAsync(x => x.Id == businessId)).Should().BeFalse();
        (await dbContext.Claims.AnyAsync(x => x.UserId == userId && x.Status == Drop.Domain.Drops.ClaimStatus.Active))
            .Should().BeFalse();

        (await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteAccount_ShouldRequireCorrectPassword()
    {
        var client = _factory.CreateClient();
        var (email, _) = await RegisterAndLoginAsync(client);
        var userId = await UserIdOfAsync(email);

        var authed = _factory.CreateClient();
        authed.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());

        var response = await authed.PostAsJsonAsync("/api/users/me/delete", new { password = "wrong-password" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await UserIdOfAsync(email)).Should().Be(userId);
    }

    private CapturingEmailSender Emails => _factory.Services.GetRequiredService<CapturingEmailSender>();

    private string CodeSentTo(string email)
    {
        var body = Emails.LastBodyTo(email);
        body.Should().NotBeNull("a reset e-mail should have been sent");
        return Regex.Match(body!, @"\b\d{6}\b").Value;
    }

    private async Task<Guid> UserIdOfAsync(string email)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        return await dbContext.Users.Where(x => x.Email == email).Select(x => x.Id).SingleAsync();
    }

    private static async Task<(string Email, string RefreshToken)> RegisterAndLoginAsync(HttpClient client)
    {
        var email = $"sec-{Guid.NewGuid():N}@drop.test";

        (await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = Password,
            firstName = "Sec",
            lastName = "Test"
        })).EnsureSuccessStatusCode();

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });
        login.EnsureSuccessStatusCode();

        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return (email, body.GetProperty("refreshToken").GetString()!);
    }
}
