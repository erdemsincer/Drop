using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Drops;

public sealed class MysteryDropTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    // Away from every other test's branches.
    private const double Latitude = 40.6;
    private const double Longitude = 30.6;

    private readonly DropApiFactory _factory;

    public MysteryDropTests(DropApiFactory factory)
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
    public async Task MysteryDrop_ShouldStaySealedFromAfar_AndOpenUpClose()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);
        var customer = Client((await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0]);

        var branch = await owner.PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/branches",
            new { name = "Hazine Şubesi", latitude = Latitude, longitude = Longitude });
        var branchId = (await branch.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var created = await owner.PostAsJsonAsync($"/api/branches/{branchId}/drops", new
        {
            title = "Bedava cheesecake",
            description = "Sadece bugün",
            capacity = 3,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            category = "Dessert",
            originalPrice = 120m,
            dealPrice = 0m,
            isMystery = true,
            hint = "Köşedeki pastanede bir sürpriz var",
        });
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var dropId = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        // ~1 km away: on the map, but sealed.
        var far = (Lat: Latitude + 0.009, Lng: Longitude);
        var farFeed = await Nearby(customer, far.Lat, far.Lng);
        var sealedDrop = farFeed.Single(x => x.GetProperty("id").GetGuid() == dropId);
        sealedDrop.GetProperty("isLocked").GetBoolean().Should().BeTrue();
        sealedDrop.GetProperty("title").GetString().Should().Be("Gizli Drop");
        sealedDrop.GetProperty("description").GetString().Should().Be("Köşedeki pastanede bir sürpriz var");
        sealedDrop.GetProperty("businessName").GetString().Should().Be("Gizli işletme");
        sealedDrop.GetProperty("dealPrice").ValueKind.Should().Be(JsonValueKind.Null);
        sealedDrop.GetProperty("latitude").GetDouble().Should().BeApproximately(Latitude, 0.0001);
        sealedDrop.ToString().Should().NotContain("cheesecake");

        var farDetail = await customer.GetFromJsonAsync<JsonElement>(Invariant($"/api/drops/{dropId}?latitude={far.Lat}&longitude={far.Lng}"));
        farDetail.GetProperty("isLocked").GetBoolean().Should().BeTrue();
        farDetail.GetProperty("distanceMeters").GetInt32().Should().BeInRange(950, 1050);
        farDetail.GetProperty("businessId").GetGuid().Should().Be(Guid.Empty);

        (await customer.GetFromJsonAsync<JsonElement>($"/api/drops/{dropId}"))
            .GetProperty("isLocked").GetBoolean().Should().BeTrue("no location, no peek");

        // Can't be caught from afar, or without saying where you are.
        await ExpectLocked(customer.PostAsync($"/api/drops/{dropId}/claims", null));
        await ExpectLocked(customer.PostAsJsonAsync($"/api/drops/{dropId}/claims", new { latitude = far.Lat, longitude = far.Lng }));

        // ~55 m away: it opens.
        var near = (Lat: Latitude + 0.0005, Lng: Longitude);
        var openDrop = (await Nearby(customer, near.Lat, near.Lng)).Single(x => x.GetProperty("id").GetGuid() == dropId);
        openDrop.GetProperty("isLocked").GetBoolean().Should().BeFalse();
        openDrop.GetProperty("title").GetString().Should().Be("Bedava cheesecake");
        openDrop.GetProperty("dealPrice").GetDecimal().Should().Be(0m);

        var nearDetail = await customer.GetFromJsonAsync<JsonElement>(Invariant($"/api/drops/{dropId}?latitude={near.Lat}&longitude={near.Lng}"));
        nearDetail.GetProperty("isLocked").GetBoolean().Should().BeFalse();
        nearDetail.GetProperty("businessId").GetGuid().Should().Be(scenario.BusinessId);

        (await customer.PostAsJsonAsync($"/api/drops/{dropId}/claims", new { latitude = near.Lat, longitude = near.Lng }))
            .StatusCode.Should().Be(HttpStatusCode.Created);

        // A shared link is a sealed teaser.
        var share = await (await _factory.CreateClient().GetAsync($"/d/{dropId}")).Content.ReadAsStringAsync();
        share.Should().Contain("Gizli Drop").And.NotContain("cheesecake");

        // The owner still sees what they published.
        var mine = await owner.GetFromJsonAsync<JsonElement>($"/api/branches/{branchId}/drops");
        var own = mine.EnumerateArray().Single(x => x.GetProperty("id").GetGuid() == dropId);
        own.GetProperty("title").GetString().Should().Be("Bedava cheesecake");
        own.GetProperty("isMystery").GetBoolean().Should().BeTrue();
    }

    private static async Task ExpectLocked(Task<HttpResponseMessage> request)
    {
        var response = await request;
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("drop.locked");
    }

    private static async Task<List<JsonElement>> Nearby(HttpClient client, double latitude, double longitude)
    {
        var body = await client.GetFromJsonAsync<JsonElement>(
            Invariant($"/api/drops/nearby?latitude={latitude}&longitude={longitude}&radiusKm=3"));
        return body.EnumerateArray().ToList();
    }

    private static string Invariant(FormattableString value) => FormattableString.Invariant(value);

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
