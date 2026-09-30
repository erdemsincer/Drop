using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Claims;

public sealed class ClaimCancellationTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public ClaimCancellationTests(DropApiFactory factory)
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
    public async Task Cancel_ShouldFreeThePlace_ForSomeoneElse()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var first = Client(users[0]);
        var second = Client(users[1]);

        var claimId = await ClaimAsync(first, scenario.DropId);

        (await second.PostAsync($"/api/drops/{scenario.DropId}/claims", null))
            .StatusCode.Should().Be(HttpStatusCode.Conflict, "the only place is taken");

        (await first.PostAsync($"/api/claims/{claimId}/cancel", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await StatusOfAsync(claimId)).Should().Be(ClaimStatus.Cancelled);
        (await second.PostAsync($"/api/drops/{scenario.DropId}/claims", null))
            .StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Cancel_ShouldAllowAnotherDrop_ButNotTheSameOneAgain()
    {
        var firstDrop = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var secondDrop = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var customer = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);

        var claimId = await ClaimAsync(customer, firstDrop.DropId);
        (await customer.PostAsync($"/api/claims/{claimId}/cancel", null)).EnsureSuccessStatusCode();

        (await customer.GetAsync("/api/claims/me/active")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var again = await customer.PostAsync($"/api/drops/{firstDrop.DropId}/claims", null);
        again.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await again.Content.ReadAsStringAsync()).Should().Contain("claim.already_exists");

        (await customer.PostAsync($"/api/drops/{secondDrop.DropId}/claims", null))
            .StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Cancel_ShouldBeForbidden_ForSomeoneElsesClaim()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var claimId = await ClaimAsync(Client(users[0]), scenario.DropId);

        (await Client(users[1]).PostAsync($"/api/claims/{claimId}/cancel", null))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        (await StatusOfAsync(claimId)).Should().Be(ClaimStatus.Active);
    }

    [Fact]
    public async Task Cancel_ShouldConflict_WhenAlreadyRedeemedOrExpired()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);

        var redeemer = Client(users[0]);
        var redeemedId = await ClaimAsync(redeemer, scenario.DropId);
        (await redeemer.PostAsJsonAsync(
            $"/api/claims/{redeemedId}/redeem",
            new { qrToken = IntegrationTestData.QrPayloadFor(_factory, scenario.BranchId) })).EnsureSuccessStatusCode();

        var redeemed = await redeemer.PostAsync($"/api/claims/{redeemedId}/cancel", null);
        redeemed.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await redeemed.Content.ReadAsStringAsync()).Should().Contain("claim.not_active");

        var expiredId = await IntegrationTestData.CreateClaimAsync(
            _factory, scenario.DropId, users[1], DateTimeOffset.UtcNow.AddMinutes(-30), TimeSpan.FromMinutes(15));

        var expired = await Client(users[1]).PostAsync($"/api/claims/{expiredId}/cancel", null);
        expired.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await expired.Content.ReadAsStringAsync()).Should().Contain("claim.expired");
    }

    private static async Task<Guid> ClaimAsync(HttpClient client, Guid dropId)
    {
        var response = await client.PostAsync($"/api/drops/{dropId}/claims", null);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("claimId").GetGuid();
    }

    private async Task<ClaimStatus> StatusOfAsync(Guid claimId)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        return (await dbContext.Claims.SingleAsync(x => x.Id == claimId)).Status;
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
