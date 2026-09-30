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

public sealed class AccountManagementTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private const string Password = "Passw0rd!123";

    private readonly DropApiFactory _factory;

    public AccountManagementTests(DropApiFactory factory)
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
    public async Task Register_ShouldEmailCode_ThatVerifiesTheAddress()
    {
        var (email, userId) = await RegisterAsync();
        var me = Client(userId);

        (await me.GetFromJsonAsync<JsonElement>("/api/users/me"))
            .GetProperty("emailVerified").GetBoolean().Should().BeFalse();

        var code = CodeSentTo(email);

        var wrong = await me.PostAsJsonAsync("/api/users/me/email/verify", new { code = OtherCode(code) });
        wrong.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await wrong.Content.ReadAsStringAsync()).Should().Contain("auth.invalid_verification_code");

        (await me.PostAsJsonAsync("/api/users/me/email/verify", new { code }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await me.GetFromJsonAsync<JsonElement>("/api/users/me"))
            .GetProperty("emailVerified").GetBoolean().Should().BeTrue();

        // Already verified: resending is a no-op, no new mail goes out.
        var sentBefore = Emails.Sent.Count(mail => mail.To == email);
        (await me.PostAsync("/api/users/me/email/resend", null)).StatusCode.Should().Be(HttpStatusCode.Accepted);
        Emails.Sent.Count(mail => mail.To == email).Should().Be(sentBefore);
    }

    [Fact]
    public async Task Approval_ShouldRequireOwnerToVerifyEmail()
    {
        var (email, ownerId) = await RegisterAsync();
        var owner = Client(ownerId);

        var created = await owner.PostAsJsonAsync("/api/businesses", new { name = $"Doğrulama Kafe {Guid.NewGuid():N}" });
        var businessId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var admin = Client(await IntegrationTestData.GetOrCreateAdminAsync(_factory));

        var listed = await admin.GetFromJsonAsync<JsonElement>("/api/admin/businesses?status=Pending");
        listed.EnumerateArray().Single(x => x.GetProperty("id").GetGuid() == businessId)
            .GetProperty("ownerEmailVerified").GetBoolean().Should().BeFalse();

        var blocked = await admin.PostAsync($"/api/admin/businesses/{businessId}/approve", null);
        blocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await blocked.Content.ReadAsStringAsync()).Should().Contain("business.owner_email_unverified");

        await owner.PostAsJsonAsync("/api/users/me/email/verify", new { code = CodeSentTo(email) });

        (await admin.PostAsync($"/api/admin/businesses/{businessId}/approve", null))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_ShouldCheckCurrent_AndSignOutOtherSessions()
    {
        var anonymous = _factory.CreateClient();
        var (email, userId) = await RegisterAsync();
        var oldSession = await LoginAsync(anonymous, email, Password);
        var me = Client(userId);

        var wrong = await me.PostAsJsonAsync(
            "/api/users/me/password",
            new { currentPassword = "not-my-password", newPassword = "N3wPassword!" });
        wrong.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var changed = await me.PostAsJsonAsync(
            "/api/users/me/password",
            new { currentPassword = Password, newPassword = "N3wPassword!" });
        changed.StatusCode.Should().Be(HttpStatusCode.OK);

        var fresh = await changed.Content.ReadFromJsonAsync<JsonElement>();
        fresh.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();

        // The fresh refresh token works; the one from before the change doesn't.
        (await anonymous.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = fresh.GetProperty("refreshToken").GetString() }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await anonymous.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = oldSession }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        (await anonymous.PostAsJsonAsync("/api/auth/login", new { email, password = Password }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.PostAsJsonAsync("/api/auth/login", new { email, password = "N3wPassword!" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_ShouldReject_SamePassword()
    {
        var (_, userId) = await RegisterAsync();

        var response = await Client(userId).PostAsJsonAsync(
            "/api/users/me/password",
            new { currentPassword = Password, newPassword = Password });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain("password.unchanged");
    }

    [Fact]
    public async Task UpdateProfile_ShouldRename_AndValidate()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var me = Client(userId);

        var updated = await me.PutAsJsonAsync("/api/users/me", new { firstName = "  Ayşe ", lastName = "Yılmaz" });
        updated.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await updated.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("firstName").GetString().Should().Be("Ayşe");
        body.GetProperty("lastName").GetString().Should().Be("Yılmaz");

        (await me.PutAsJsonAsync("/api/users/me", new { firstName = "", lastName = "Yılmaz" }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private CapturingEmailSender Emails => _factory.Services.GetRequiredService<CapturingEmailSender>();

    private string CodeSentTo(string email)
    {
        var body = Emails.LastBodyTo(email);
        body.Should().NotBeNull("a code e-mail should have been sent");
        return Regex.Match(body!, @"\b\d{6}\b").Value;
    }

    private static string OtherCode(string code) => code == "000000" ? "111111" : "000000";

    private async Task<(string Email, Guid UserId)> RegisterAsync()
    {
        var email = $"acct-{Guid.NewGuid():N}@drop.test";

        (await _factory.CreateClient().PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = Password,
            firstName = "Hesap",
            lastName = "Test"
        })).EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        var userId = await dbContext.Users.Where(x => x.Email == email).Select(x => x.Id).SingleAsync();

        return (email, userId);
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        login.EnsureSuccessStatusCode();
        return (await login.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("refreshToken").GetString()!;
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
