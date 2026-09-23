using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Domain.Businesses;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Businesses;

public sealed class BusinessMembersTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public BusinessMembersTests(DropApiFactory factory)
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
    public async Task Owner_ShouldAddStaffByEmail_AndStaffGetsBusinessAccess()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var staffId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var add = await CreateClient(scenario.OwnerId).PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/members",
            new { email = await EmailOfAsync(staffId), role = "Staff" });

        add.StatusCode.Should().Be(HttpStatusCode.Created);

        var mine = await CreateClient(staffId).GetFromJsonAsync<JsonElement>("/api/businesses/me");
        mine.GetArrayLength().Should().Be(1);
        mine[0].GetProperty("role").GetString().Should().Be("Staff");

        var members = await CreateClient(scenario.OwnerId)
            .GetFromJsonAsync<JsonElement>($"/api/businesses/{scenario.BusinessId}/members");
        members.GetArrayLength().Should().Be(2);
        members[0].GetProperty("role").GetString().Should().Be("Owner");
    }

    [Fact]
    public async Task Add_ShouldReturnNotFound_WhenEmailHasNoAccount()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var add = await CreateClient(scenario.OwnerId).PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/members",
            new { email = $"nobody-{Guid.NewGuid():N}@drop.test", role = "Staff" });

        add.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await add.Content.ReadAsStringAsync()).Should().Contain("member.user_not_found");
    }

    [Fact]
    public async Task Add_ShouldReturnConflict_WhenAlreadyMember()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var staffId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, staffId, BusinessMemberRole.Staff);

        var add = await CreateClient(scenario.OwnerId).PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/members",
            new { email = await EmailOfAsync(staffId), role = "Manager" });

        add.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Manager_ShouldNotAddManager_ButMayAddStaff()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 3);
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, users[0], BusinessMemberRole.Manager);
        var manager = CreateClient(users[0]);

        var addManager = await manager.PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/members",
            new { email = await EmailOfAsync(users[1]), role = "Manager" });
        addManager.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var addStaff = await manager.PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/members",
            new { email = await EmailOfAsync(users[2]), role = "Staff" });
        addStaff.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Add_ShouldRejectOwnerRole()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var add = await CreateClient(scenario.OwnerId).PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/members",
            new { email = await EmailOfAsync(userId), role = "Owner" });

        add.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Remove_ShouldNotRemoveOwner_ButStaffMayLeave()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var staffId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, staffId, BusinessMemberRole.Staff);

        var removeOwner = await CreateClient(staffId)
            .DeleteAsync($"/api/businesses/{scenario.BusinessId}/members/{scenario.OwnerId}");
        removeOwner.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var leave = await CreateClient(staffId)
            .DeleteAsync($"/api/businesses/{scenario.BusinessId}/members/{staffId}");
        leave.StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await CreateClient(staffId).GetAsync($"/api/branches/{scenario.BranchId}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Staff_ShouldNotRemoveOtherStaff()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, users[0], BusinessMemberRole.Staff);
        await IntegrationTestData.AddMemberAsync(_factory, scenario.BusinessId, users[1], BusinessMemberRole.Staff);

        var response = await CreateClient(users[0])
            .DeleteAsync($"/api/businesses/{scenario.BusinessId}/members/{users[1]}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<string> EmailOfAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        return await dbContext.Users.Where(x => x.Id == userId).Select(x => x.Email).SingleAsync();
    }

    private HttpClient CreateClient(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
