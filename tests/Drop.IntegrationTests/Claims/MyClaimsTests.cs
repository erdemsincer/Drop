using System.Net.Http.Json;
using System.Text.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Claims;

public sealed class MyClaimsTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public MyClaimsTests(DropApiFactory factory)
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
    public async Task GetMine_ShouldListOwnClaimsNewestFirst_WithEffectiveStatus()
    {
        var first = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var second = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var now = DateTimeOffset.UtcNow;

        // Older one already lapsed but still stored as Active.
        await IntegrationTestData.CreateClaimAsync(_factory, first.DropId, users[0], now.AddMinutes(-30), TimeSpan.FromMinutes(15));
        await IntegrationTestData.CreateClaimAsync(_factory, second.DropId, users[0], now, TimeSpan.FromMinutes(15));
        // Someone else's claim must not leak.
        await IntegrationTestData.CreateClaimAsync(_factory, second.DropId, users[1], now, TimeSpan.FromMinutes(15));

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", users[0].ToString());

        var claims = await client.GetFromJsonAsync<JsonElement>("/api/claims/me");

        claims.GetArrayLength().Should().Be(2);
        claims[0].GetProperty("dropId").GetGuid().Should().Be(second.DropId);
        claims[0].GetProperty("status").GetString().Should().Be("Active");
        claims[0].GetProperty("businessName").GetString().Should().Be("Drop Coffee");
        claims[1].GetProperty("status").GetString().Should().Be("Expired");
    }

    [Fact]
    public async Task GetMe_ShouldReturnProfile()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());

        var me = await client.GetFromJsonAsync<JsonElement>("/api/users/me");

        me.GetProperty("id").GetGuid().Should().Be(userId);
        me.GetProperty("email").GetString().Should().EndWith("@drop.test");
    }
}
