using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Drops;

/// <summary>Prices and savings, ratings, photos, the business page, upcoming drops and the "caught" push.</summary>
public sealed class DealExperienceTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    // Away from every other test's branches, so nearby/upcoming only see this test's drops.
    private const double Latitude = 40.5;
    private const double Longitude = 30.5;

    private static readonly byte[] TinyJpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9];

    private readonly DropApiFactory _factory;

    public DealExperienceTests(DropApiFactory factory)
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
    public async Task Prices_ShouldShowEverywhere_AndRedeemingShouldAddToSavings()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);
        var customerId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var customer = Client(customerId);

        (await owner.PutAsJsonAsync($"/api/drops/{scenario.DropId}", Update(originalPrice: 120m, dealPrice: 75m)))
            .EnsureSuccessStatusCode();

        var detail = await customer.GetFromJsonAsync<JsonElement>($"/api/drops/{scenario.DropId}");
        detail.GetProperty("originalPrice").GetDecimal().Should().Be(120m);
        detail.GetProperty("dealPrice").GetDecimal().Should().Be(75m);

        var claimId = await ClaimAsync(customer, scenario.DropId);
        await RedeemAsync(customer, claimId, scenario.BranchId);

        var stats = await customer.GetFromJsonAsync<JsonElement>("/api/users/me/stats");
        stats.GetProperty("claimed").GetInt32().Should().Be(1);
        stats.GetProperty("redeemed").GetInt32().Should().Be(1);
        stats.GetProperty("saved").GetDecimal().Should().Be(45m);

        var mine = await customer.GetFromJsonAsync<JsonElement>("/api/claims/me");
        mine[0].GetProperty("originalPrice").GetDecimal().Should().Be(120m);
        mine[0].GetProperty("businessId").GetGuid().Should().Be(scenario.BusinessId);
    }

    [Fact]
    public async Task FallingPrice_ShouldLockThePriceWhenCaught_AndCountItInSavings()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);
        var customerId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var customer = Client(customerId);

        var created = await owner.PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", new
        {
            title = "Düşen fiyatlı pizza",
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            originalPrice = 120m,
            dealPrice = 40m,
            startPrice = 100m,
        });
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var dropId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var detail = await customer.GetFromJsonAsync<JsonElement>($"/api/drops/{dropId}");
        detail.GetProperty("startPrice").GetDecimal().Should().Be(100m);

        // Caught right away: the price is still at (or a lira under) the start.
        var claim = await customer.PostAsync($"/api/drops/{dropId}/claims", null);
        claim.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await claim.Content.ReadFromJsonAsync<JsonElement>();
        var locked = body.GetProperty("price").GetDecimal();
        locked.Should().BeInRange(99m, 100m);

        await RedeemAsync(customer, body.GetProperty("claimId").GetGuid(), scenario.BranchId);

        var stats = await customer.GetFromJsonAsync<JsonElement>("/api/users/me/stats");
        stats.GetProperty("saved").GetDecimal().Should().Be(120m - locked);

        var mine = await customer.GetFromJsonAsync<JsonElement>("/api/claims/me");
        mine[0].GetProperty("price").GetDecimal().Should().Be(locked);

        // A start price outside the deal range is refused.
        var bad = await owner.PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", new
        {
            title = "Yanlış",
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            originalPrice = 120m,
            dealPrice = 40m,
            startPrice = 30m,
        });
        bad.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await bad.Content.ReadAsStringAsync()).Should().Contain("start_price.invalid");
    }

    [Theory]
    [InlineData(100, 100, "deal_price.not_lower")]
    [InlineData(100, null, "pricing.incomplete")]
    public async Task Prices_ShouldBeRejected_WhenNotADeal(int original, int? deal, string code)
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);

        var response = await Client(scenario.OwnerId).PutAsJsonAsync(
            $"/api/drops/{scenario.DropId}",
            Update(originalPrice: original, dealPrice: deal));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain(code);
    }

    [Fact]
    public async Task Rating_ShouldNeedARedeemedDrop_AndShowOnTheBusiness()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var customer = Client(users[0]);

        var claimId = await ClaimAsync(customer, scenario.DropId);

        var early = await customer.PostAsJsonAsync($"/api/claims/{claimId}/rating", new { stars = 5 });
        early.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await early.Content.ReadAsStringAsync()).Should().Contain("claim.not_redeemed");

        await RedeemAsync(customer, claimId, scenario.BranchId);

        (await Client(users[1]).PostAsJsonAsync($"/api/claims/{claimId}/rating", new { stars = 1 }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await customer.PostAsJsonAsync($"/api/claims/{claimId}/rating", new { stars = 9 }))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);

        (await customer.PostAsJsonAsync($"/api/claims/{claimId}/rating", new { stars = 2 })).EnsureSuccessStatusCode();
        // Changing one's mind overwrites.
        (await customer.PostAsJsonAsync($"/api/claims/{claimId}/rating", new { stars = 4 })).EnsureSuccessStatusCode();

        var detail = await customer.GetFromJsonAsync<JsonElement>($"/api/drops/{scenario.DropId}");
        detail.GetProperty("businessRating").GetDouble().Should().Be(4);
        detail.GetProperty("businessRatingCount").GetInt32().Should().Be(1);

        var mine = await customer.GetFromJsonAsync<JsonElement>("/api/claims/me");
        mine[0].GetProperty("rating").GetInt32().Should().Be(4);
    }

    [Fact]
    public async Task Photo_ShouldUpload_AttachToTheDrop_AndBeServedPublicly()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);

        // Not an image: refused whatever the client claims the type is.
        var bogus = await Upload(owner, "not a picture"u8.ToArray());
        bogus.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await bogus.Content.ReadAsStringAsync()).Should().Contain("media.unsupported");

        var uploaded = await Upload(owner, TinyJpeg);
        uploaded.StatusCode.Should().Be(HttpStatusCode.OK);
        var photoId = (await uploaded.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        (await owner.PutAsJsonAsync($"/api/drops/{scenario.DropId}", Update(photoId: Guid.NewGuid())))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await owner.PutAsJsonAsync($"/api/drops/{scenario.DropId}", Update(photoId: photoId))).EnsureSuccessStatusCode();

        var detail = await owner.GetFromJsonAsync<JsonElement>($"/api/drops/{scenario.DropId}");
        detail.GetProperty("photoId").GetGuid().Should().Be(photoId);

        var served = await _factory.CreateClient().GetAsync($"/api/media/{photoId}");
        served.StatusCode.Should().Be(HttpStatusCode.OK);
        served.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
        (await served.Content.ReadAsByteArrayAsync()).Should().Equal(TinyJpeg);
    }

    [Fact]
    public async Task BusinessPage_And_Upcoming_ShouldShowLiveAndScheduledDrops()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);
        var customer = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);

        var branch = await owner.PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/branches",
            new { name = "Yakında Şubesi", latitude = Latitude, longitude = Longitude });
        var branchId = (await branch.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var startsAt = DateTimeOffset.UtcNow.AddHours(3);
        (await owner.PostAsJsonAsync($"/api/branches/{branchId}/drops", new
        {
            title = "Akşam tatlısı",
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 8,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            startsAt,
            category = "Dessert",
            originalPrice = 90m,
            dealPrice = 45m,
        })).StatusCode.Should().Be(HttpStatusCode.Created);

        var upcoming = await customer.GetFromJsonAsync<JsonElement>(
            FormattableString.Invariant($"/api/drops/upcoming?latitude={Latitude}&longitude={Longitude}&radiusKm=1"));
        var soon = upcoming.EnumerateArray().Should().ContainSingle().Subject;
        soon.GetProperty("title").GetString().Should().Be("Akşam tatlısı");
        soon.GetProperty("dealPrice").GetDecimal().Should().Be(45m);

        (await customer.PostAsync($"/api/businesses/{scenario.BusinessId}/follow", null)).EnsureSuccessStatusCode();

        var profile = await customer.GetFromJsonAsync<JsonElement>($"/api/businesses/{scenario.BusinessId}/profile");
        profile.GetProperty("isFollowing").GetBoolean().Should().BeTrue();
        profile.GetProperty("followerCount").GetInt32().Should().Be(1);
        profile.GetProperty("branches").GetArrayLength().Should().Be(2);
        profile.GetProperty("liveDrops").EnumerateArray().Select(x => x.GetProperty("id").GetGuid())
            .Should().Contain(scenario.DropId);
        profile.GetProperty("upcomingDrops").EnumerateArray().Single().GetProperty("title").GetString()
            .Should().Be("Akşam tatlısı");

        (await customer.GetAsync($"/api/businesses/{Guid.NewGuid()}/profile")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Claiming_ShouldPushTheBusinessTeam()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);
        var ownerToken = $"ExponentPushToken[owner-{Guid.NewGuid():N}]";
        (await owner.PutAsJsonAsync("/api/users/me/push-token", new { token = ownerToken, platform = "ios" }))
            .EnsureSuccessStatusCode();

        var customer = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);
        await ClaimAsync(customer, scenario.DropId);

        var push = await _factory.Services.GetRequiredService<CapturingPushSender>().WaitForAsync(ownerToken);
        push.Should().NotBeNull();
        push!.Title.Should().Contain("yakaladı");
        push.Data!["branchId"].Should().Be(scenario.BranchId.ToString());
    }

    private static object Update(decimal? originalPrice = null, decimal? dealPrice = null, Guid? photoId = null) => new
    {
        title = "Fiyatlı Drop",
        description = (string?)null,
        minimumSpend = (decimal?)null,
        capacity = 5,
        originalPrice,
        dealPrice,
        photoId,
    };

    private static Task<HttpResponseMessage> Upload(HttpClient client, byte[] bytes)
    {
        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(file, "file", "photo.jpg");
        return client.PostAsync("/api/media", content);
    }

    private static async Task<Guid> ClaimAsync(HttpClient client, Guid dropId)
    {
        var response = await client.PostAsync($"/api/drops/{dropId}/claims", null);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("claimId").GetGuid();
    }

    private async Task RedeemAsync(HttpClient client, Guid claimId, Guid branchId)
    {
        (await client.PostAsJsonAsync(
            $"/api/claims/{claimId}/redeem",
            new { qrToken = IntegrationTestData.QrPayloadFor(_factory, branchId) })).EnsureSuccessStatusCode();
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
