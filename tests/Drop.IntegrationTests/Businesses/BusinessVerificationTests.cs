using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Businesses;

public sealed class BusinessVerificationTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public BusinessVerificationTests(DropApiFactory factory)
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
    public async Task NewBusiness_ShouldBePending_AndPublishOnlyAfterApproval()
    {
        var ownerId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var owner = Client(ownerId);
        var (businessId, branchId) = await CreateBusinessWithBranchAsync(owner);

        var mine = await owner.GetFromJsonAsync<JsonElement>("/api/businesses/me");
        mine[0].GetProperty("status").GetString().Should().Be("Pending");

        var branch = await owner.GetFromJsonAsync<JsonElement>($"/api/branches/{branchId}");
        branch.GetProperty("canPublishDrops").GetBoolean().Should().BeFalse();

        var blocked = await CreateDropAsync(owner, branchId);
        blocked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await blocked.Content.ReadAsStringAsync()).Should().Contain("business.not_approved");

        var admin = Client(await IntegrationTestData.GetOrCreateAdminAsync(_factory));
        (await admin.PostAsync($"/api/admin/businesses/{businessId}/approve", null))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        (await CreateDropAsync(owner, branchId)).StatusCode.Should().Be(HttpStatusCode.Created);
        Emails.LastBodyTo(await EmailOfAsync(ownerId)).Should().Contain("onaylandı");
    }

    [Fact]
    public async Task AdminEndpoints_ShouldBeForbidden_ForRegularUsers()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var user = Client(userId);

        (await user.GetAsync("/api/admin/businesses")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.PostAsync($"/api/admin/businesses/{scenario.BusinessId}/approve", null))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        (await user.GetFromJsonAsync<JsonElement>("/api/users/me")).GetProperty("isAdmin").GetBoolean().Should().BeFalse();

        var admin = Client(await IntegrationTestData.GetOrCreateAdminAsync(_factory));
        (await admin.GetFromJsonAsync<JsonElement>("/api/users/me")).GetProperty("isAdmin").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Reject_ShouldRecordReason_VisibleToOwner()
    {
        var ownerId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var owner = Client(ownerId);
        var (businessId, _) = await CreateBusinessWithBranchAsync(owner);
        var admin = Client(await IntegrationTestData.GetOrCreateAdminAsync(_factory));

        var pending = await admin.GetFromJsonAsync<JsonElement>("/api/admin/businesses?status=Pending");
        pending.EnumerateArray().Should().Contain(x => x.GetProperty("id").GetGuid() == businessId);

        var reject = await admin.PostAsJsonAsync(
            $"/api/admin/businesses/{businessId}/reject",
            new { reason = "Vergi levhası eksik" });
        reject.StatusCode.Should().Be(HttpStatusCode.OK);

        var mine = await owner.GetFromJsonAsync<JsonElement>("/api/businesses/me");
        mine[0].GetProperty("status").GetString().Should().Be("Rejected");
        mine[0].GetProperty("statusReason").GetString().Should().Be("Vergi levhası eksik");

        // Rejecting twice is not a valid transition.
        (await admin.PostAsJsonAsync($"/api/admin/businesses/{businessId}/reject", new { reason = "x" }))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Suspend_ShouldWithdrawLiveDropsAndReservations()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var customer = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await IntegrationTestData.CreateClaimAsync(
            _factory, scenario.DropId, customer, DateTimeOffset.UtcNow, TimeSpan.FromMinutes(15));
        var admin = Client(await IntegrationTestData.GetOrCreateAdminAsync(_factory));

        var suspend = await admin.PostAsJsonAsync(
            $"/api/admin/businesses/{scenario.BusinessId}/suspend",
            new { reason = "Şikayet incelemesi" });
        suspend.StatusCode.Should().Be(HttpStatusCode.OK);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
            (await dbContext.Drops.SingleAsync(x => x.Id == scenario.DropId)).Status.Should().Be(DropStatus.Cancelled);
            (await dbContext.Claims.SingleAsync(x => x.Id == claimId)).Status.Should().Be(ClaimStatus.Cancelled);
        }

        (await CreateDropAsync(Client(scenario.OwnerId), scenario.BranchId))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);

        // Reinstating is an approval.
        (await admin.PostAsync($"/api/admin/businesses/{scenario.BusinessId}/approve", null))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await CreateDropAsync(Client(scenario.OwnerId), scenario.BranchId))
            .StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Moderation_ShouldRequireReason()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var admin = Client(await IntegrationTestData.GetOrCreateAdminAsync(_factory));

        var response = await admin.PostAsJsonAsync($"/api/admin/businesses/{scenario.BusinessId}/suspend", new { reason = "" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private CapturingEmailSender Emails => _factory.Services.GetRequiredService<CapturingEmailSender>();

    private async Task<(Guid BusinessId, Guid BranchId)> CreateBusinessWithBranchAsync(HttpClient owner)
    {
        var business = await owner.PostAsJsonAsync("/api/businesses", new { name = $"Yeni Kafe {Guid.NewGuid():N}" });
        var businessId = (await business.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var branch = await owner.PostAsJsonAsync(
            $"/api/businesses/{businessId}/branches",
            new { name = "Merkez", latitude = 37.0, longitude = 35.3 });
        var branchId = (await branch.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        return (businessId, branchId);
    }

    private static Task<HttpResponseMessage> CreateDropAsync(HttpClient owner, Guid branchId) =>
        owner.PostAsJsonAsync($"/api/branches/{branchId}/drops", new
        {
            title = "Doğrulama Drop",
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15
        });

    private async Task<string> EmailOfAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<DropDbContext>()
            .Users.Where(x => x.Id == userId).Select(x => x.Email).SingleAsync();
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
