using Drop.Domain.Drops;
using Drop.Infrastructure.BackgroundJobs;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Drops;

public sealed class ExpirationSweeperTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public ExpirationSweeperTests(DropApiFactory factory)
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
    public async Task Run_ShouldExpireEndedDropsAndLapsedClaims_AndLeaveLiveOnesAlone()
    {
        var ended = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var live = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var users = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var now = DateTimeOffset.UtcNow;

        var lapsedClaim = await IntegrationTestData.CreateClaimAsync(
            _factory, live.DropId, users[0], now.AddMinutes(-30), TimeSpan.FromMinutes(15));
        var activeClaim = await IntegrationTestData.CreateClaimAsync(
            _factory, live.DropId, users[1], now, TimeSpan.FromMinutes(15));

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();

        await dbContext.Drops
            .Where(x => x.Id == ended.DropId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.EndsAt, now.AddMinutes(-1)));

        var sweeper = scope.ServiceProvider.GetRequiredService<ExpirationSweeper>();

        await sweeper.RunAsync(now);
        var second = await sweeper.RunAsync(now);

        second.Should().Be(new ExpirationResult(0, 0), "the sweep is idempotent");

        var drops = await dbContext.Drops.AsNoTracking()
            .Where(x => x.Id == ended.DropId || x.Id == live.DropId)
            .ToDictionaryAsync(x => x.Id, x => x.Status);

        drops[ended.DropId].Should().Be(DropStatus.Expired);
        drops[live.DropId].Should().Be(DropStatus.Active);

        var claims = await dbContext.Claims.AsNoTracking()
            .Where(x => x.Id == lapsedClaim || x.Id == activeClaim)
            .ToDictionaryAsync(x => x.Id, x => x.Status);

        claims[lapsedClaim].Should().Be(ClaimStatus.Expired);
        claims[activeClaim].Should().Be(ClaimStatus.Active);
    }
}
