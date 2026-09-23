using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Businesses;

/// <summary>
/// Read endpoints used by the business mode of the mobile app.
/// </summary>
public sealed class BusinessQueryTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public BusinessQueryTests(DropApiFactory factory)
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
    public async Task GetMine_ShouldReturnEmptyArray_WhenUserHasNoBusiness()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await CreateClient(userId).GetAsync("/api/businesses/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("[]");
    }

    [Fact]
    public async Task CreateBusiness_ShouldMakeCurrentUserOwner()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var client = CreateClient(userId);
        var name = $"Biz {Guid.NewGuid():N}";

        var created = await client.PostAsJsonAsync("/api/businesses", new { name });
        created.StatusCode.Should().Be(HttpStatusCode.Created);

        var mine = await client.GetFromJsonAsync<JsonElement>("/api/businesses/me");

        mine.GetArrayLength().Should().Be(1);
        mine[0].GetProperty("name").GetString().Should().Be(name);
        mine[0].GetProperty("role").GetString().Should().Be("Owner");
    }

    [Fact]
    public async Task CreateBusiness_ShouldAllowSameNameForDifferentOwners()
    {
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var name = $"Drop Coffee {Guid.NewGuid():N}";

        var first = await CreateClient(users[0]).PostAsJsonAsync("/api/businesses", new { name });
        var second = await CreateClient(users[1]).PostAsJsonAsync("/api/businesses", new { name });

        first.StatusCode.Should().Be(HttpStatusCode.Created);
        second.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GetBranches_ShouldReturnForbidden_WhenUserIsNotMember()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var outsiderId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await CreateClient(outsiderId)
            .GetAsync($"/api/businesses/{scenario.BusinessId}/branches");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetBranches_ShouldListBranches_WhenUserIsOwner()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var branches = await CreateClient(scenario.OwnerId)
            .GetFromJsonAsync<JsonElement>($"/api/businesses/{scenario.BusinessId}/branches");

        branches.GetArrayLength().Should().Be(1);
        branches[0].GetProperty("id").GetGuid().Should().Be(scenario.BranchId);
        branches[0].GetProperty("activeDropCount").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task Staff_ShouldViewBranchAndShowQr_ButNotCreateDrops()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var staffId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, staffId, BusinessMemberRole.Staff);

        var client = CreateClient(staffId);

        var branch = await client.GetFromJsonAsync<JsonElement>($"/api/branches/{scenario.BranchId}");
        branch.GetProperty("role").GetString().Should().Be("Staff");
        branch.GetProperty("canManage").GetBoolean().Should().BeFalse();
        branch.GetProperty("canShowQr").GetBoolean().Should().BeTrue();

        (await client.GetAsync($"/api/branches/{scenario.BranchId}/drops"))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        (await client.GetAsync($"/api/branches/{scenario.BranchId}/qr"))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var drop = await client.PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", new
        {
            title = "Staff drop",
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15
        });
        drop.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetBranchDrops_ShouldReportActiveRedeemedAndRemainingSeparately()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 10);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 4);
        var now = DateTimeOffset.UtcNow;

        // 2 active, 1 redeemed, 1 expired (expired frees its slot).
        await IntegrationTestData.CreateClaimAsync(_factory, scenario.DropId, users[0], now, TimeSpan.FromMinutes(15));
        await IntegrationTestData.CreateClaimAsync(_factory, scenario.DropId, users[1], now, TimeSpan.FromMinutes(15));
        var redeemedId = await IntegrationTestData.CreateClaimAsync(_factory, scenario.DropId, users[2], now, TimeSpan.FromMinutes(15));
        await IntegrationTestData.CreateClaimAsync(_factory, scenario.DropId, users[3], now.AddMinutes(-30), TimeSpan.FromMinutes(15));

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
            var claim = await dbContext.Claims.SingleAsync(x => x.Id == redeemedId);
            claim.Redeem(DateTimeOffset.UtcNow);
            await dbContext.SaveChangesAsync();
        }

        var drops = await CreateClient(scenario.OwnerId)
            .GetFromJsonAsync<JsonElement>($"/api/branches/{scenario.BranchId}/drops");

        var drop = drops[0];
        drop.GetProperty("activeClaimCount").GetInt32().Should().Be(2);
        drop.GetProperty("redeemedCount").GetInt32().Should().Be(1);
        drop.GetProperty("remainingCapacity").GetInt32().Should().Be(7);
        drop.GetProperty("claimDurationMinutes").GetInt32().Should().Be(15);
        drop.GetProperty("status").GetString().Should().Be("Active");
    }

    [Fact]
    public async Task GetBranchDrops_ShouldReportExpired_WhenDropEndedButStatusStillActive()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
            await dbContext.Drops
                .Where(x => x.Id == scenario.DropId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.EndsAt, DateTimeOffset.UtcNow.AddMinutes(-1)));
        }

        var drops = await CreateClient(scenario.OwnerId)
            .GetFromJsonAsync<JsonElement>($"/api/branches/{scenario.BranchId}/drops");

        drops[0].GetProperty("status").GetString().Should().Be(nameof(DropStatus.Expired));
    }

    private HttpClient CreateClient(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
