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

public sealed class BranchAndBusinessManagementTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public BranchAndBusinessManagementTests(DropApiFactory factory)
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
    public async Task CloseBranch_ShouldWithdrawDrops_AndBlockPublishingUntilReopened()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var customer = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await IntegrationTestData.CreateClaimAsync(
            _factory, scenario.DropId, customer, DateTimeOffset.UtcNow, TimeSpan.FromMinutes(15));
        var owner = Client(scenario.OwnerId);

        (await owner.PostAsync($"/api/branches/{scenario.BranchId}/close", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
            (await dbContext.Drops.SingleAsync(x => x.Id == scenario.DropId)).Status.Should().Be(DropStatus.Cancelled);
            (await dbContext.Claims.SingleAsync(x => x.Id == claimId)).Status.Should().Be(ClaimStatus.Cancelled);
        }

        var branch = await owner.GetFromJsonAsync<JsonElement>($"/api/branches/{scenario.BranchId}");
        branch.GetProperty("isClosed").GetBoolean().Should().BeTrue();
        branch.GetProperty("canPublishDrops").GetBoolean().Should().BeFalse();

        var list = await owner.GetFromJsonAsync<JsonElement>($"/api/businesses/{scenario.BusinessId}/branches");
        list[0].GetProperty("isClosed").GetBoolean().Should().BeTrue();

        var blocked = await CreateDropAsync(owner, scenario.BranchId);
        blocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await blocked.Content.ReadAsStringAsync()).Should().Contain("branch.closed");

        (await owner.PostAsync($"/api/branches/{scenario.BranchId}/close", null))
            .StatusCode.Should().Be(HttpStatusCode.Conflict, "it is already closed");

        (await owner.PostAsync($"/api/branches/{scenario.BranchId}/reopen", null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await CreateDropAsync(owner, scenario.BranchId)).StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CloseBranch_ShouldBeForbidden_ForStaff()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var staffId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, staffId, BusinessMemberRole.Staff);

        (await Client(staffId).PostAsync($"/api/branches/{scenario.BranchId}/close", null))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task RenameBusiness_ShouldBeOwnerOnly()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var managerId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, managerId, BusinessMemberRole.Manager);

        (await Client(managerId).PutAsJsonAsync($"/api/businesses/{scenario.BusinessId}", new { name = "Başka Ad" }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var renamed = await Client(scenario.OwnerId)
            .PutAsJsonAsync($"/api/businesses/{scenario.BusinessId}", new { name = "  Drop Kahve Evi " });
        renamed.StatusCode.Should().Be(HttpStatusCode.OK);
        (await renamed.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("name").GetString().Should().Be("Drop Kahve Evi");

        (await Client(scenario.OwnerId).PutAsJsonAsync($"/api/businesses/{scenario.BusinessId}", new { name = "" }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private static Task<HttpResponseMessage> CreateDropAsync(HttpClient owner, Guid branchId) =>
        owner.PostAsJsonAsync($"/api/branches/{branchId}/drops", new
        {
            title = "Yeni Drop",
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15
        });

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
