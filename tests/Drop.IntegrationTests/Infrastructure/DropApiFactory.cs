using Drop.IntegrationTests.Infrastructure;
using Drop.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

namespace Drop.IntegrationTests.Infrastructure;

/// <summary>
/// WebApplicationFactory that uses a PostgreSQL Testcontainer for integration tests.
/// Automatically migrates the database and provides a clean test environment.
/// </summary>
public sealed class DropApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres =
        // Same PostGIS image as docker-compose, so spatial queries (nearby feed) run in tests too.
        new PostgreSqlBuilder("postgis/postgis:16-3.4")
            .WithDatabase("drop_test")
            .WithUsername("drop")
            .WithPassword("drop_test_password")
            .Build();

    public const string AdminEmail = "platform-admin@drop.test";

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    public async Task InitializeDatabaseAsync()
    {
        using var scope = Services.CreateScope();

        var dbContext =
            scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

        await dbContext.Database.MigrateAsync();
        
        // Create PostGIS extension if available (for full compatibility)
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS postgis;");
        }
        catch
        {
            // PostGIS not available - migrations will work without spatial features in tests
        }
    }

    protected override void ConfigureWebHost(
        IWebHostBuilder builder)
    {
        // Expiration is exercised directly via ExpirationSweeper; a live worker
        // would flip states mid-test and make assertions racy.
        builder.UseSetting("BackgroundJobs:Expiration:Enabled", "false");

        // Tests hammer auth endpoints from one "IP"; rate limits are covered separately.
        builder.UseSetting("RateLimiting:Enabled", "false");

        builder.UseSetting("Admin:Emails", AdminEmail);

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<Drop.Application.Notifications.IEmailSender>();
            services.AddSingleton<CapturingEmailSender>();
            services.AddSingleton<Drop.Application.Notifications.IEmailSender>(
                sp => sp.GetRequiredService<CapturingEmailSender>());

            // Never call Expo from tests; record what would have been pushed.
            services.RemoveAll<Drop.Application.Notifications.Push.IPushSender>();
            services.AddSingleton<CapturingPushSender>();
            services.AddSingleton<Drop.Application.Notifications.Push.IPushSender>(
                sp => sp.GetRequiredService<CapturingPushSender>());

            // Remove existing DbContext registration
            services.RemoveAll<DbContextOptions<DropDbContext>>();

            // Add Testcontainer DB context
            services.AddDbContext<DropDbContext>(
                options =>
                {
                    options.UseNpgsql(
                        _postgres.GetConnectionString(),
                        npgsqlOptions =>
                        {
                            npgsqlOptions.UseNetTopologySuite();
                        });
                });

            // Configure test authentication scheme
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme =
                        TestAuthHandler.Scheme;
                    options.DefaultChallengeScheme =
                        TestAuthHandler.Scheme;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.Scheme,
                    _ =>
                    {
                    });
        });
    }
}
