using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.Infrastructure.BackgroundJobs;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Businesses;

public sealed class FollowAndPushTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public FollowAndPushTests(DropApiFactory factory)
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
    public async Task Follow_ShouldBeIdempotent_AndListed()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var customer = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);

        (await customer.PostAsync($"/api/businesses/{scenario.BusinessId}/follow", null)).StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await customer.PostAsync($"/api/businesses/{scenario.BusinessId}/follow", null)).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var follows = await customer.GetFromJsonAsync<JsonElement>("/api/users/me/follows");
        follows.EnumerateArray().Should().ContainSingle()
            .Which.GetProperty("businessId").GetGuid().Should().Be(scenario.BusinessId);

        (await customer.DeleteAsync($"/api/businesses/{scenario.BusinessId}/follow")).StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await customer.GetFromJsonAsync<JsonElement>("/api/users/me/follows")).GetArrayLength().Should().Be(0);

        (await customer.PostAsync($"/api/businesses/{Guid.NewGuid()}/follow", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task NewDrop_ShouldPushFollowers_Only()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var follower = Client(users[0]);
        var stranger = Client(users[1]);
        var followerToken = NewToken();
        var strangerToken = NewToken();

        await RegisterTokenAsync(follower, followerToken);
        await RegisterTokenAsync(stranger, strangerToken);
        (await follower.PostAsync($"/api/businesses/{scenario.BusinessId}/follow", null)).EnsureSuccessStatusCode();

        var created = await CreateDropAsync(Client(scenario.OwnerId), scenario.BranchId, "Takipçilere özel", startsAt: null);
        var dropId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var push = await Pushes.WaitForAsync(followerToken);
        push.Should().NotBeNull();
        push!.Title.Should().Contain("Drop Coffee");
        push.Body.Should().Contain("Takipçilere özel");
        push.Data["dropId"].Should().Be(dropId.ToString());

        Pushes.Sent.Should().NotContain(message => message.To == strangerToken);
    }

    [Fact]
    public async Task ScheduledDrop_ShouldPushWhenItGoesLive_NotWhenCreated()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var follower = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);
        var token = NewToken();
        await RegisterTokenAsync(follower, token);
        await follower.PostAsync($"/api/businesses/{scenario.BusinessId}/follow", null);

        var startsAt = DateTimeOffset.UtcNow.AddMinutes(30);
        var created = await CreateDropAsync(Client(scenario.OwnerId), scenario.BranchId, "Akşam Drop'u", startsAt);
        created.StatusCode.Should().Be(HttpStatusCode.Created);

        (await Pushes.WaitForAsync(token, TimeSpan.FromMilliseconds(500))).Should().BeNull("it isn't live yet");

        using (var scope = _factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<ExpirationSweeper>().RunAsync(startsAt.AddMinutes(1));
        }

        var push = await Pushes.WaitForAsync(token);
        push.Should().NotBeNull("the sweep put it live");
        push!.Body.Should().Contain("Akşam Drop'u");
    }

    [Fact]
    public async Task DeadToken_ShouldBeRemoved_AfterPush()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var follower = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);
        var token = NewToken();
        Pushes.GoneTokens[token] = true;

        await RegisterTokenAsync(follower, token);
        await follower.PostAsync($"/api/businesses/{scenario.BusinessId}/follow", null);
        await CreateDropAsync(Client(scenario.OwnerId), scenario.BranchId, "Son Drop", startsAt: null);

        (await Pushes.WaitForAsync(token)).Should().NotBeNull();

        var removed = false;
        for (var i = 0; i < 50 && !removed; i++)
        {
            using var scope = _factory.Services.CreateScope();
            removed = !await scope.ServiceProvider.GetRequiredService<DropDbContext>().DeviceTokens.AnyAsync(x => x.Token == token);
            if (!removed) await Task.Delay(50);
        }

        removed.Should().BeTrue();
    }

    [Fact]
    public async Task PushToken_ShouldMoveToNewAccount_AndRejectNonExpoTokens()
    {
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var token = NewToken();

        await RegisterTokenAsync(Client(users[0]), token);
        await RegisterTokenAsync(Client(users[1]), token);

        using (var scope = _factory.Services.CreateScope())
        {
            var stored = await scope.ServiceProvider.GetRequiredService<DropDbContext>().DeviceTokens.SingleAsync(x => x.Token == token);
            stored.UserId.Should().Be(users[1]);
        }

        (await Client(users[0]).PutAsJsonAsync("/api/users/me/push-token", new { token = "not-a-token", platform = "ios" }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        (await Client(users[1]).PostAsJsonAsync("/api/users/me/push-token/remove", new { token }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    private CapturingPushSender Pushes => _factory.Services.GetRequiredService<CapturingPushSender>();

    private static string NewToken() => $"ExponentPushToken[{Guid.NewGuid():N}]";

    private static async Task RegisterTokenAsync(HttpClient client, string token) =>
        (await client.PutAsJsonAsync("/api/users/me/push-token", new { token, platform = "ios" })).EnsureSuccessStatusCode();

    private static Task<HttpResponseMessage> CreateDropAsync(HttpClient owner, Guid branchId, string title, DateTimeOffset? startsAt) =>
        owner.PostAsJsonAsync($"/api/branches/{branchId}/drops", new
        {
            title,
            description = (string?)null,
            minimumSpend = (decimal?)null,
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
