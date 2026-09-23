using System.Net;
using System.Net.Http.Json;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Drops;

/// <summary>
/// Ending a drop early keeps existing reservations; cancelling withdraws them.
/// </summary>
public sealed class DropLifecycleTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public DropLifecycleTests(DropApiFactory factory)
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
    public async Task End_ShouldBlockNewClaims_ButKeepExistingReservationRedeemable()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var qrToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var claimId = await IntegrationTestData.CreateClaimAsync(
            _factory, scenario.DropId, users[0], DateTimeOffset.UtcNow, TimeSpan.FromMinutes(15));

        var end = await CreateClient(scenario.OwnerId).PostAsync($"/api/drops/{scenario.DropId}/end", null);
        end.StatusCode.Should().Be(HttpStatusCode.OK);

        var newClaim = await CreateClient(users[1]).PostAsync($"/api/drops/{scenario.DropId}/claims", null);
        newClaim.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await newClaim.Content.ReadAsStringAsync()).Should().Contain("drop.not_active");

        var redeem = await CreateClient(users[0])
            .PostAsJsonAsync($"/api/claims/{claimId}/redeem", new { qrToken });
        redeem.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Cancel_ShouldExpireActiveReservations()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var qrToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await IntegrationTestData.CreateClaimAsync(
            _factory, scenario.DropId, userId, DateTimeOffset.UtcNow, TimeSpan.FromMinutes(15));

        var cancel = await CreateClient(scenario.OwnerId).PostAsync($"/api/drops/{scenario.DropId}/cancel", null);
        cancel.StatusCode.Should().Be(HttpStatusCode.OK);
        (await cancel.Content.ReadAsStringAsync()).Should().Contain("\"releasedClaimCount\":1");

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
            (await dbContext.Drops.SingleAsync(x => x.Id == scenario.DropId)).Status.Should().Be(DropStatus.Cancelled);
            (await dbContext.Claims.SingleAsync(x => x.Id == claimId)).Status.Should().Be(ClaimStatus.Expired);
        }

        var customer = CreateClient(userId);

        (await customer.GetAsync("/api/claims/me/active")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var redeem = await customer.PostAsJsonAsync($"/api/claims/{claimId}/redeem", new { qrToken });
        redeem.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await redeem.Content.ReadAsStringAsync()).Should().Contain("claim.not_active");
    }

    [Fact]
    public async Task End_ShouldReturnForbidden_WhenUserCannotManageBranch()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var outsiderId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await CreateClient(outsiderId).PostAsync($"/api/drops/{scenario.DropId}/end", null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task End_ShouldReturnConflict_WhenAlreadyEnded()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var owner = CreateClient(scenario.OwnerId);

        (await owner.PostAsync($"/api/drops/{scenario.DropId}/end", null)).StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await owner.PostAsync($"/api/drops/{scenario.DropId}/cancel", null);
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync()).Should().Contain("drop.not_active");
    }

    private HttpClient CreateClient(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
