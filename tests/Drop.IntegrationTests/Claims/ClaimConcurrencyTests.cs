using System.Net;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Claims;

/// <summary>
/// Integration tests for claim concurrency safety.
/// Tests row-level locking and transaction isolation with real PostgreSQL.
/// </summary>
public sealed class ClaimConcurrencyTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public ClaimConcurrencyTests(DropApiFactory factory)
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

    /// <summary>
    /// Main concurrency test: 20 parallel requests to claim a drop with capacity=1.
    /// Expected: exactly 1 succeeds (201), 19 fail with conflict (409), DB has exactly 1 claim.
    /// </summary>
    [Fact]
    public async Task Claim_ShouldAllowOnlyOneUser_WhenCapacityIsOne()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(
            _factory,
            capacity: 1);

        var userIds = await IntegrationTestData.CreateUsersAsync(
            _factory,
            count: 20);

        var requests = userIds
            .Select(userId => SendClaimRequestAsync(scenario.DropId, userId))
            .ToArray();

        // Act
        var responses = await Task.WhenAll(requests);

        // Assert
        var successCount = responses
            .Count(x => x.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses
            .Count(x => x.StatusCode == HttpStatusCode.Conflict);

        successCount.Should().Be(1, "exactly one user should succeed");
        conflictCount.Should().Be(19, "exactly 19 users should get conflict");

        // Verify DB has exactly 1 claim for this drop
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider
            .GetRequiredService<DropDbContext>();

        var claimCount = await dbContext.Claims
            .CountAsync(x => x.DropId == scenario.DropId);

        claimCount.Should().Be(1, "database should have exactly 1 claim");
    }

    /// <summary>
    /// Test that expired active claims free up capacity.
    /// Drop with capacity=1 has an expired active claim, new user should succeed.
    /// </summary>
    [Fact]
    public async Task Claim_ShouldReuseCapacity_WhenPreviousClaimExpired()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(
            _factory,
            capacity: 1);

        var userIds = await IntegrationTestData.CreateUsersAsync(
            _factory,
            count: 2);

        var user1Id = userIds[0];
        var user2Id = userIds[1];

        // User 1 claims and gets an expired claim
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

            var now = DateTimeOffset.UtcNow;

            var expiredClaim = new Domain.Drops.Claim(
                scenario.DropId,
                user1Id,
                now.AddMinutes(-60), // created 60 minutes ago
                TimeSpan.FromMinutes(30)); // 30-minute expiry, so it's expired now

            dbContext.Claims.Add(expiredClaim);
            await dbContext.SaveChangesAsync();
        }

        // Act - User 2 tries to claim
        var response = await SendClaimRequestAsync(scenario.DropId, user2Id);

        // Assert - Should succeed because user1's claim is expired
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        using var scope2 = _factory.Services.CreateScope();
        var dbContext2 = scope2.ServiceProvider
            .GetRequiredService<DropDbContext>();

        var claimCount = await dbContext2.Claims
            .CountAsync(x => x.DropId == scenario.DropId);

        claimCount.Should().Be(2, "should have 2 claims total (1 expired, 1 new)");
    }

    /// <summary>
    /// Test that redeemed claims do NOT free up capacity.
    /// Drop with capacity=1 has a redeemed claim, new user should fail with 409.
    /// </summary>
    [Fact]
    public async Task Claim_ShouldNotReuseCapacity_WhenPreviousClaimWasRedeemed()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(
            _factory,
            capacity: 1);

        var userIds = await IntegrationTestData.CreateUsersAsync(
            _factory,
            count: 2);

        var user1Id = userIds[0];
        var user2Id = userIds[1];

        // User 1 claims and redeems
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

            var now = DateTimeOffset.UtcNow;

            var redeemedClaim = new Domain.Drops.Claim(
                scenario.DropId,
                user1Id,
                now,
                TimeSpan.FromMinutes(30));

            redeemedClaim.Redeem(now); // Mark as redeemed

            dbContext.Claims.Add(redeemedClaim);
            await dbContext.SaveChangesAsync();
        }

        // Act - User 2 tries to claim
        var response = await SendClaimRequestAsync(scenario.DropId, user2Id);

        // Assert - Should fail because capacity is occupied by redeemed claim
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    /// <summary>
    /// Test that the same user cannot claim the same drop twice.
    /// Should return 409 Conflict with code "claim.already_exists".
    /// </summary>
    [Fact]
    public async Task Claim_ShouldReturnConflict_WhenUserAlreadyClaimedDrop()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(
            _factory,
            capacity: 10);

        var userIds = await IntegrationTestData.CreateUsersAsync(
            _factory,
            count: 1);

        var userId = userIds[0];

        // Act - First claim should succeed
        var response1 = await SendClaimRequestAsync(scenario.DropId, userId);
        response1.StatusCode.Should().Be(HttpStatusCode.Created);

        // Second claim from same user should fail
        var response2 = await SendClaimRequestAsync(scenario.DropId, userId);

        // Assert
        response2.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var content = await response2.Content.ReadAsStringAsync();
        content.Should().Contain("claim.already_exists");
    }

    /// <summary>
    /// Test that claiming an expired drop returns 409 Conflict.
    /// Drop's EndsAt is in the past.
    /// </summary>
    [Fact]
    public async Task Claim_ShouldReturnConflict_WhenDropExpired()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(
            _factory,
            capacity: 1);

        // Make the drop expired by manually updating timestamps
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

            var drop = await dbContext.Drops
                .SingleAsync(x => x.Id == scenario.DropId);

            var now = DateTimeOffset.UtcNow;

            // Set drop to have already ended
            // Use reflection to set private properties (in real scenarios, add a proper method to domain)
            var startsAtProperty = typeof(Domain.Drops.Drop)
                .GetProperty(nameof(Domain.Drops.Drop.StartsAt))!
                .SetMethod!;

            var endsAtProperty = typeof(Domain.Drops.Drop)
                .GetProperty(nameof(Domain.Drops.Drop.EndsAt))!
                .SetMethod!;

            startsAtProperty.Invoke(drop, new object?[] { now.AddMinutes(-60) });
            endsAtProperty.Invoke(drop, new object?[] { now.AddMinutes(-30) });

            await dbContext.SaveChangesAsync();
        }

        var userIds = await IntegrationTestData.CreateUsersAsync(
            _factory,
            count: 1);

        // Act
        var response = await SendClaimRequestAsync(scenario.DropId, userIds[0]);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("drop.not_active");
    }

    private async Task<HttpResponseMessage> SendClaimRequestAsync(
        Guid dropId,
        Guid userId)
    {
        var client = _factory.CreateClient();

        // Add test authentication header
        client.DefaultRequestHeaders.Add(
            "X-Test-User-Id",
            userId.ToString());

        return await client.PostAsync(
            $"/api/drops/{dropId}/claims",
            null);
    }
}
