using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Domain.Common;
using Drop.Domain.Drops;
using Drop.Infrastructure.BackgroundJobs;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Drops;

public sealed class RecurringDropTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public RecurringDropTests(DropApiFactory factory)
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
    public async Task Schedule_ShouldPlanItsNextDropOnce_AndDeletingShouldWithdrawIt()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);

        // Two hours from now, local time: within the next day's planning window.
        var startTime = TurkeyTime.ToLocal(DateTimeOffset.UtcNow.AddHours(2)).ToString("HH:mm");

        var created = await owner.PostAsJsonAsync($"/api/branches/{scenario.BranchId}/schedules", new
        {
            title = "Her gün kahve",
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 10,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            startTime,
            days = new[] { 1, 2, 3, 4, 5, 6, 7 },
            category = "Coffee",
            originalPrice = 80m,
            dealPrice = 40m,
        });
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var schedule = await created.Content.ReadFromJsonAsync<JsonElement>();
        var scheduleId = schedule.GetProperty("id").GetGuid();
        schedule.GetProperty("startTime").GetString().Should().Be(startTime);
        schedule.GetProperty("days").GetArrayLength().Should().Be(7);

        await SweepAsync();
        await SweepAsync();

        var planned = await PlannedAsync(scheduleId);
        planned.Should().ContainSingle("a second sweep must not plan the same slot again");
        planned[0].Status.Should().Be(DropStatus.Scheduled);
        planned[0].DealPrice.Should().Be(40m);

        var listed = await owner.GetFromJsonAsync<JsonElement>($"/api/branches/{scenario.BranchId}/schedules");
        listed.EnumerateArray().Should().ContainSingle(x => x.GetProperty("id").GetGuid() == scheduleId);

        (await owner.PostAsync($"/api/schedules/{scheduleId}/pause", null)).EnsureSuccessStatusCode();
        (await owner.DeleteAsync($"/api/schedules/{scheduleId}")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await PlannedAsync(scheduleId)).Should().BeEmpty("the link is cleared when the schedule goes");
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        (await dbContext.Drops.SingleAsync(x => x.Id == planned[0].Id)).Status.Should().Be(DropStatus.Cancelled);
    }

    [Fact]
    public async Task Schedule_ShouldBeForManagersOnly_AndValidated()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var stranger = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);

        var body = new
        {
            title = "Kahve",
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            startTime = "15:00",
            days = new[] { 1 },
        };

        (await stranger.PostAsJsonAsync($"/api/branches/{scenario.BranchId}/schedules", body))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var invalid = await Client(scenario.OwnerId).PostAsJsonAsync(
            $"/api/branches/{scenario.BranchId}/schedules",
            body with { startTime = "25:99", days = Array.Empty<int>() });
        invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await invalid.Content.ReadAsStringAsync();
        problem.Should().Contain("start_time.invalid").And.Contain("days.required");
    }

    [Fact]
    public async Task Badges_ShouldListEveryBadge_WithProgress()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var badges = await Client(userId).GetFromJsonAsync<JsonElement>("/api/users/me/badges");

        badges.GetArrayLength().Should().BeGreaterThan(5);
        badges.EnumerateArray().Should().OnlyContain(x => !x.GetProperty("earned").GetBoolean());
        badges.EnumerateArray().Select(x => x.GetProperty("id").GetString()).Should().Contain("first_drop");
    }

    private async Task SweepAsync()
    {
        using var scope = _factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ExpirationSweeper>().RunAsync(DateTimeOffset.UtcNow);
    }

    private async Task<List<Domain.Drops.Drop>> PlannedAsync(Guid scheduleId)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();
        return await dbContext.Drops.AsNoTracking().Where(x => x.ScheduleId == scheduleId).ToListAsync();
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
