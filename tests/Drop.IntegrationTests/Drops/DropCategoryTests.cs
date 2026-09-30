using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Drops;

public sealed class DropCategoryTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    // Far from every other test's branches, so the feed only sees this test's drops.
    private const double Latitude = 41.0;
    private const double Longitude = 29.0;

    private readonly DropApiFactory _factory;

    public DropCategoryTests(DropApiFactory factory)
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
    public async Task NearbyFeed_ShouldFilterByCategory_AndShowIt()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);

        var branch = await owner.PostAsJsonAsync(
            $"/api/businesses/{scenario.BusinessId}/branches",
            new { name = "Kategori Şubesi", latitude = Latitude, longitude = Longitude });
        var branchId = (await branch.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        (await CreateDropAsync(owner, branchId, "Kahve %30", "Coffee")).StatusCode.Should().Be(HttpStatusCode.Created);
        (await CreateDropAsync(owner, branchId, "Pizza 1+1", "Food")).StatusCode.Should().Be(HttpStatusCode.Created);
        (await CreateDropAsync(owner, branchId, "Kategorisiz", null)).StatusCode.Should().Be(HttpStatusCode.Created);

        var all = await Nearby(owner, category: null);
        all.Select(x => x.GetProperty("category").GetString())
            .Should().BeEquivalentTo(["Coffee", "Food", "Other"]);

        var coffee = await Nearby(owner, category: "Coffee");
        coffee.Should().ContainSingle().Which.GetProperty("title").GetString().Should().Be("Kahve %30");

        var drops = await owner.GetFromJsonAsync<JsonElement>($"/api/branches/{branchId}/drops");
        drops.EnumerateArray().Select(x => x.GetProperty("category").GetString())
            .Should().BeEquivalentTo(["Coffee", "Food", "Other"]);
    }

    [Fact]
    public async Task UpdateDrop_ShouldChangeCategory_OnlyWhenGiven()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = Client(scenario.OwnerId);

        (await owner.PutAsJsonAsync($"/api/drops/{scenario.DropId}", new
        {
            title = "Yeni başlık",
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 5,
            category = "Dessert"
        })).EnsureSuccessStatusCode();

        (await owner.PutAsJsonAsync($"/api/drops/{scenario.DropId}", new
        {
            title = "Yine yeni",
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 5
        })).EnsureSuccessStatusCode();

        var detail = await owner.GetFromJsonAsync<JsonElement>($"/api/drops/{scenario.DropId}");
        detail.GetProperty("category").GetString().Should().Be("Dessert");
    }

    [Fact]
    public async Task Nearby_ShouldRejectUnknownCategory()
    {
        var response = await _factory.CreateClient()
            .GetAsync($"/api/drops/nearby?latitude={Latitude}&longitude={Longitude}&category=Spaceships");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private static Task<HttpResponseMessage> CreateDropAsync(HttpClient owner, Guid branchId, string title, string? category) =>
        owner.PostAsJsonAsync($"/api/branches/{branchId}/drops", new
        {
            title,
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 5,
            durationMinutes = 60,
            claimDurationMinutes = 15,
            category
        });

    private static async Task<IReadOnlyList<JsonElement>> Nearby(HttpClient client, string? category)
    {
        var url = $"/api/drops/nearby?latitude={Latitude}&longitude={Longitude}&radiusKm=1"
                  + (category is null ? "" : $"&category={category}");
        var body = await client.GetFromJsonAsync<JsonElement>(url);
        return body.EnumerateArray().ToList();
    }

    private HttpClient Client(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
