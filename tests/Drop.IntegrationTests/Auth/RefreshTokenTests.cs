using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Auth;

public sealed class RefreshTokenTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private const string Password = "Passw0rd!123";

    private readonly DropApiFactory _factory;

    public RefreshTokenTests(DropApiFactory factory)
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
    public async Task Refresh_ShouldRotateToken()
    {
        var client = _factory.CreateClient();
        var session = await RegisterAndLoginAsync(client);

        var refreshed = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = session.RefreshToken });

        refreshed.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await refreshed.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        body.GetProperty("refreshToken").GetString().Should().NotBe(session.RefreshToken);
        body.GetProperty("expiresIn").GetInt32().Should().BePositive();
    }

    [Fact]
    public async Task Refresh_ShouldRevokeWholeSession_WhenOldTokenIsReused()
    {
        var client = _factory.CreateClient();
        var session = await RegisterAndLoginAsync(client);

        var first = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = session.RefreshToken });
        var rotated = (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("refreshToken").GetString();

        // Attacker replays the stolen original token.
        var replay = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = session.RefreshToken });
        replay.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await replay.Content.ReadAsStringAsync()).Should().Contain("auth.invalid_refresh_token");

        // The legitimate, rotated token is now dead too.
        var legit = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = rotated });
        legit.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_ShouldRevokeRefreshToken()
    {
        var client = _factory.CreateClient();
        var session = await RegisterAndLoginAsync(client);

        var logout = await client.PostAsJsonAsync("/api/auth/logout", new { refreshToken = session.RefreshToken });
        logout.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var refresh = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = session.RefreshToken });
        refresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_ShouldReturnUnauthorized_ForUnknownToken()
    {
        var response = await _factory.CreateClient()
            .PostAsJsonAsync("/api/auth/refresh", new { refreshToken = "NOT-A-REAL-TOKEN" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static async Task<(string AccessToken, string RefreshToken)> RegisterAndLoginAsync(HttpClient client)
    {
        var email = $"refresh-{Guid.NewGuid():N}@drop.test";

        var register = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = Password,
            firstName = "Refresh",
            lastName = "Test"
        });
        register.EnsureSuccessStatusCode();

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Password });
        login.EnsureSuccessStatusCode();

        var body = await login.Content.ReadFromJsonAsync<JsonElement>();

        return (body.GetProperty("accessToken").GetString()!, body.GetProperty("refreshToken").GetString()!);
    }
}
