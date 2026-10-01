using System.Net;
using System.Net.Http.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Drops;

public sealed class SharePageTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public SharePageTests(DropApiFactory factory)
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
    public async Task SharedLink_ShouldPreviewTheDrop_WithoutSigningIn_AndEscapeItsText()
    {
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var owner = _factory.CreateClient();
        owner.DefaultRequestHeaders.Add("X-Test-User-Id", scenario.OwnerId.ToString());

        // A title that would break the page (or worse) if it went in unescaped.
        (await owner.PutAsJsonAsync($"/api/drops/{scenario.DropId}", new
        {
            title = "Kahve <script>alert(1)</script> & kek",
            description = (string?)null,
            minimumSpend = (decimal?)null,
            capacity = 5,
            category = "Coffee",
        })).EnsureSuccessStatusCode();

        var response = await _factory.CreateClient().GetAsync($"/d/{scenario.DropId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/html");

        var html = await response.Content.ReadAsStringAsync();
        html.Should().Contain("og:title");
        html.Should().Contain("KAHVE");
        html.Should().Contain("Kahve &lt;script&gt;alert(1)&lt;/script&gt; &amp; kek");
        html.Should().NotContain("<script>alert(1)</script>");
        html.Should().Contain($"dropmobile://drop/{scenario.DropId}");
        html.Should().NotContain("{{");
    }

    [Fact]
    public async Task UnknownDrop_ShouldSayItEnded()
    {
        var response = await _factory.CreateClient().GetAsync($"/d/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Contain("Bu Drop sona erdi");
    }
}
