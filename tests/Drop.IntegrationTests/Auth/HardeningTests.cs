using System.Net;
using System.Net.Http.Json;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;

namespace Drop.IntegrationTests.Auth;

public sealed class HardeningTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public HardeningTests(DropApiFactory factory)
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
    public async Task AuthEndpoints_ShouldReturn429_AfterLimit()
    {
        using var limited = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("RateLimiting:Enabled", "true");
            builder.UseSetting("RateLimiting:AuthPerMinute", "3");
        });

        var client = limited.CreateClient();
        var body = new { email = "brute@drop.test", password = "Guess12345!" };

        for (var i = 0; i < 3; i++)
        {
            (await client.PostAsJsonAsync("/api/auth/login", body))
                .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        var blocked = await client.PostAsJsonAsync("/api/auth/login", body);

        blocked.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        blocked.Headers.RetryAfter.Should().NotBeNull();
        (await blocked.Content.ReadAsStringAsync()).Should().Contain("rate_limit.exceeded");
    }

    [Fact]
    public void Startup_ShouldRefuseDevelopmentSecrets_InProduction()
    {
        using var production = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            // Development secrets supplied explicitly, as a misconfigured deploy would.
            builder.UseSetting("Jwt:Key", "development-secret-key-change-in-production-to-at-least-32-chars");
            builder.UseSetting("Jwt:Issuer", "Drop");
            builder.UseSetting("Jwt:Audience", "Drop.Mobile");
            builder.UseSetting("Qr:SigningKey", "development-qr-signing-key-change-in-production-32+");
            builder.UseSetting("ConnectionStrings:Database", "Host=localhost");
        });

        var start = () => production.CreateClient();

        start.Should().Throw<Exception>();
    }
}
