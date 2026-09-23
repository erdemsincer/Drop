using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Domain.Drops;
using Drop.Infrastructure.BackgroundJobs;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Drops;

public sealed class ScheduledDropTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public ScheduledDropTests(DropApiFactory factory)
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
    public async Task ScheduledDrop_ShouldBeUnclaimableUntilStart_ThenGoLive()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var customer = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var startsAt = DateTimeOffset.UtcNow.AddHours(2);

        var created = await CreateDropAsync(scenario, startsAt);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await created.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("status").GetString().Should().Be("Scheduled");
        var dropId = body.GetProperty("id").GetGuid();

        (await Client(customer).PostAsync($"/api/drops/{dropId}/claims", null))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);

        var drops = await Client(scenario.OwnerId)
            .GetFromJsonAsync<JsonElement>($"/api/branches/{scenario.BranchId}/drops");
        drops.EnumerateArray().Single(x => x.GetProperty("id").GetGuid() == dropId)
            .GetProperty("status").GetString().Should().Be("Scheduled");

        // The sweep reaches the start time.
        using (var scope = _factory.Services.CreateScope())
        {
            var result = await scope.ServiceProvider.GetRequiredService<ExpirationSweeper>()
                .RunAsync(startsAt.AddSeconds(1));
            result.ActivatedDrops.Should().BeGreaterThanOrEqualTo(1);

            var drop = await scope.ServiceProvider.GetRequiredService<DropDbContext>()
                .Drops.AsNoTracking().SingleAsync(x => x.Id == dropId);
            drop.Status.Should().Be(DropStatus.Active);
            drop.EndsAt.Should().Be(startsAt.AddMinutes(60));
        }
    }

    [Fact]
    public async Task Create_ShouldPublishImmediately_WhenStartIsNowOrPast()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var created = await CreateDropAsync(scenario, DateTimeOffset.UtcNow.AddMinutes(-5));

        (await created.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("status").GetString().Should().Be("Active");
    }

    [Fact]
    public async Task Create_ShouldRejectStartMoreThan30DaysAhead()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var created = await CreateDropAsync(scenario, DateTimeOffset.UtcNow.AddDays(45));

        created.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await created.Content.ReadAsStringAsync()).Should().Contain("starts_at.too_far");
    }

    [Fact]
    public async Task ScheduledDrop_CanBeCancelled_ButNotEnded()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var created = await CreateDropAsync(scenario, DateTimeOffset.UtcNow.AddHours(3));
        var dropId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        var owner = Client(scenario.OwnerId);

        (await owner.PostAsync($"/api/drops/{dropId}/end", null)).StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await owner.PostAsync($"/api/drops/{dropId}/cancel", null)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DropDetail_ShouldIncludeBranchCoordinates_ForDirections()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var detail = await _factory.CreateClient().GetFromJsonAsync<JsonElement>($"/api/drops/{scenario.DropId}");

        detail.GetProperty("latitude").GetDouble().Should().Be(37.0005);
        detail.GetProperty("longitude").GetDouble().Should().Be(35.32);
    }

    private Task<HttpResponseMessage> CreateDropAsync(ClaimScenario scenario, DateTimeOffset startsAt) =>
        Client(scenario.OwnerId).PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", new
        {
            title = "Planlı Drop",
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            startsAt
        });

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
