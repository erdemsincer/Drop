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

public sealed class BusinessStatsTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public BusinessStatsTests(DropApiFactory factory)
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
    public async Task Stats_ShouldCountReservationsRedemptionsAndReturningCustomers()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 10);
        var customers = await IntegrationTestData.CreateUsersAsync(_factory, count: 3);
        var now = DateTimeOffset.UtcNow;

        // Customer 0 already came 40 days ago, so today's visit makes them "returning".
        await RedeemedClaimAsync(scenario.BranchId, customers[0], now.AddDays(-40));

        foreach (var customer in customers)
        {
            await IntegrationTestData.CreateClaimAsync(_factory, scenario.DropId, customer, now, TimeSpan.FromMinutes(15));
        }

        // Customers 0 and 1 use theirs; customer 2 only reserved.
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
            var todays = await dbContext.Claims
                .Where(x => x.DropId == scenario.DropId && x.CreatedAt > now.AddMinutes(-1) &&
                            (x.UserId == customers[0] || x.UserId == customers[1]))
                .ToListAsync();
            todays.ForEach(claim => claim.Redeem(now.AddMinutes(1)));
            await dbContext.SaveChangesAsync();
        }

        var stats = await Client(scenario.OwnerId)
            .GetFromJsonAsync<JsonElement>($"/api/businesses/{scenario.BusinessId}/stats?days=7");

        stats.GetProperty("days").GetInt32().Should().Be(7);
        stats.GetProperty("reservations").GetInt32().Should().Be(3);
        stats.GetProperty("redemptions").GetInt32().Should().Be(2);
        stats.GetProperty("redemptionRate").GetDouble().Should().BeApproximately(0.667, 0.001);
        stats.GetProperty("uniqueCustomers").GetInt32().Should().Be(2);
        stats.GetProperty("returningCustomers").GetInt32().Should().Be(1);

        var daily = stats.GetProperty("daily").EnumerateArray().ToList();
        daily.Should().HaveCount(7);
        daily.Sum(day => day.GetProperty("redemptions").GetInt32()).Should().Be(2);

        var top = stats.GetProperty("topDrops")[0];
        top.GetProperty("dropId").GetGuid().Should().Be(scenario.DropId);
        top.GetProperty("redemptions").GetInt32().Should().Be(2);

        stats.GetProperty("branches")[0].GetProperty("redemptions").GetInt32().Should().Be(2);
    }

    [Fact]
    public async Task Stats_ShouldBeForbidden_ForStaff()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var staffId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, staffId, BusinessMemberRole.Staff);

        (await Client(staffId).GetAsync($"/api/businesses/{scenario.BusinessId}/stats"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    /// <summary>A redeemed claim on an earlier drop of the same branch (one claim per drop per user).</summary>
    private async Task RedeemedClaimAsync(Guid branchId, Guid userId, DateTimeOffset at)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();

        var earlier = new Domain.Drops.Drop(branchId, "Eski Drop", null, null, 5, TimeSpan.FromHours(1), TimeSpan.FromMinutes(15));
        earlier.Activate(at);
        dbContext.Drops.Add(earlier);

        var claim = new Claim(earlier.Id, userId, at, TimeSpan.FromMinutes(15));
        claim.Redeem(at.AddMinutes(1));
        dbContext.Claims.Add(claim);
        await dbContext.SaveChangesAsync();
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
