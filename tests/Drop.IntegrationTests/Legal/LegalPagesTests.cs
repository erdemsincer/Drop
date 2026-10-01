using System.Net;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;

namespace Drop.IntegrationTests.Legal;

public sealed class LegalPagesTests : IClassFixture<DropApiFactory>
{
    private readonly DropApiFactory _factory;

    public LegalPagesTests(DropApiFactory factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("/legal/privacy", "KVKK")]
    [InlineData("/legal/terms", "Kullanım Koşulları")]
    public async Task Pages_ShouldBePublicHtml_WithEveryPlaceholderFilled(string path, string expected)
    {
        var response = await _factory.CreateClient().GetAsync(path);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/html");

        var html = await response.Content.ReadAsStringAsync();
        html.Should().Contain(expected);
        html.Should().NotContain("{{");
    }
}
