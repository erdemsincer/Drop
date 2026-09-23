using System.Net;
using System.Net.Http.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Businesses;

/// <summary>
/// Only owners/managers of a business may manage its branches, drops and QR tokens.
/// </summary>
public sealed class BusinessAuthorizationTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public BusinessAuthorizationTests(DropApiFactory factory)
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
    public async Task CreateQrToken_ShouldReturnForbidden_WhenUserIsNotBusinessMember()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var outsiderId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await CreateClient(outsiderId)
            .PostAsync($"/api/branches/{scenario.BranchId}/qr-token", null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await response.Content.ReadAsStringAsync()).Should().Contain("business.access_denied");
    }

    [Fact]
    public async Task CreateQrToken_ShouldReturnToken_WhenUserIsOwner()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var response = await CreateClient(scenario.OwnerId)
            .PostAsync($"/api/branches/{scenario.BranchId}/qr-token", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Contain("token");
    }

    [Fact]
    public async Task CreateDrop_ShouldReturnForbidden_WhenUserIsNotBusinessMember()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var outsiderId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await CreateClient(outsiderId)
            .PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", ValidDrop());

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await response.Content.ReadAsStringAsync()).Should().Contain("business.access_denied");
    }

    [Fact]
    public async Task CreateDrop_ShouldReturnUnauthorized_WhenAnonymous()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var response = await _factory.CreateClient()
            .PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", ValidDrop());

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateDrop_ShouldSucceed_WhenUserIsOwner()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);

        var response = await CreateClient(scenario.OwnerId)
            .PostAsJsonAsync($"/api/branches/{scenario.BranchId}/drops", ValidDrop());

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateBranch_ShouldReturnForbidden_WhenUserIsNotBusinessMember()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 1);
        var outsiderId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await CreateClient(outsiderId)
            .PostAsJsonAsync(
                $"/api/businesses/{scenario.BusinessId}/branches",
                new { name = "Kaçak Şube", latitude = 37.0, longitude = 35.3 });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Nearby_ShouldReturnBadRequest_WhenRadiusTooLarge()
    {
        var response = await _factory.CreateClient()
            .GetAsync("/api/drops/nearby?latitude=37&longitude=35.3&radiusKm=500");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain("radius.too_large");
    }

    private static object ValidDrop() => new
    {
        title = "Test Drop",
        description = (string?)null,
        minimumSpend = (decimal?)null,
        capacity = 5,
        durationMinutes = 60,
        claimDurationMinutes = 15
    };

    private HttpClient CreateClient(Guid userId)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User-Id", userId.ToString());
        return client;
    }
}
