using System.Net;
using System.Net.Http.Json;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Drop.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Claims;

/// <summary>
/// Integration tests for claim redemption via branch QR token.
/// </summary>
public sealed class ClaimRedemptionTests : IClassFixture<DropApiFactory>, IAsyncLifetime
{
    private readonly DropApiFactory _factory;

    public ClaimRedemptionTests(DropApiFactory factory)
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
    public async Task Redeem_ShouldRedeemClaim_WhenQrBelongsToDropBranch()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var qrToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await CreateActiveClaimAsync(scenario.DropId, userId);

        // Act
        var response = await SendRedeemRequestAsync(claimId, userId, qrToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain(claimId.ToString());

        var claim = await GetClaimAsync(claimId);
        claim.Status.Should().Be(ClaimStatus.Redeemed);
        claim.RedeemedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Redeem_ShouldReturnConflict_WhenQrBelongsToAnotherBranch()
    {
        // Arrange
        var scenarioA = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var scenarioB = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenarioA.BranchId);
        var qrTokenB = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenarioB.BranchId);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await CreateActiveClaimAsync(scenarioA.DropId, userId);

        // Act
        var response = await SendRedeemRequestAsync(claimId, userId, qrTokenB);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("qr.invalid");

        var claim = await GetClaimAsync(claimId);
        claim.Status.Should().Be(ClaimStatus.Active);
        claim.RedeemedAt.Should().BeNull();
    }

    [Fact]
    public async Task Redeem_ShouldReturnConflict_WhenQrTokenWasRevoked()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var oldToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();

            var tokens = await dbContext.BranchQrTokens
                .Where(x => x.BranchId == scenario.BranchId)
                .ToListAsync();

            tokens.ForEach(x => x.Revoke(DateTimeOffset.UtcNow));

            await dbContext.SaveChangesAsync();
        }

        await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await CreateActiveClaimAsync(scenario.DropId, userId);

        // Act
        var response = await SendRedeemRequestAsync(claimId, userId, oldToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("qr.invalid");
    }

    [Fact]
    public async Task Redeem_ShouldReturnConflict_WhenClaimExpired()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var qrToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var claimId = await IntegrationTestData.CreateClaimAsync(
            _factory,
            scenario.DropId,
            userId,
            DateTimeOffset.UtcNow.AddMinutes(-30),
            TimeSpan.FromMinutes(15));

        // Act
        var response = await SendRedeemRequestAsync(claimId, userId, qrToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("claim.expired");

        var claim = await GetClaimAsync(claimId);
        claim.RedeemedAt.Should().BeNull();
    }

    [Fact]
    public async Task Redeem_ShouldReturnForbidden_WhenClaimBelongsToAnotherUser()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var qrToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var userIds = await IntegrationTestData.CreateUsersAsync(_factory, count: 2);
        var claimId = await CreateActiveClaimAsync(scenario.DropId, userIds[0]);

        // Act
        var response = await SendRedeemRequestAsync(claimId, userIds[1], qrToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await response.Content.ReadAsStringAsync()).Should().Contain("claim.access_denied");

        var claim = await GetClaimAsync(claimId);
        claim.Status.Should().Be(ClaimStatus.Active);
    }

    [Fact]
    public async Task Redeem_ShouldReturnConflict_WhenClaimAlreadyRedeemed()
    {
        // Arrange
        var scenario = await IntegrationTestData.CreateClaimScenarioAsync(_factory, capacity: 5);
        var qrToken = await IntegrationTestData.CreateActiveQrTokenAsync(_factory, scenario.BranchId);
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];
        var claimId = await CreateActiveClaimAsync(scenario.DropId, userId);

        var first = await SendRedeemRequestAsync(claimId, userId, qrToken);
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        // Act
        var second = await SendRedeemRequestAsync(claimId, userId, qrToken);

        // Assert
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await second.Content.ReadAsStringAsync()).Should().Contain("claim.not_active");
    }

    [Fact]
    public async Task Redeem_ShouldReturnNotFound_WhenClaimDoesNotExist()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await SendRedeemRequestAsync(Guid.NewGuid(), userId, "ANY-TOKEN");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.Content.ReadAsStringAsync()).Should().Contain("claim.not_found");
    }

    [Fact]
    public async Task Redeem_ShouldReturnBadRequest_WhenQrTokenMissing()
    {
        var userId = (await IntegrationTestData.CreateUsersAsync(_factory, count: 1))[0];

        var response = await SendRedeemRequestAsync(Guid.NewGuid(), userId, "");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.Content.ReadAsStringAsync()).Should().Contain("qr.required");
    }

    private Task<Guid> CreateActiveClaimAsync(Guid dropId, Guid userId)
    {
        return IntegrationTestData.CreateClaimAsync(
            _factory,
            dropId,
            userId,
            DateTimeOffset.UtcNow,
            TimeSpan.FromMinutes(15));
    }

    private async Task<Claim> GetClaimAsync(Guid claimId)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();

        return await dbContext.Claims
            .AsNoTracking()
            .SingleAsync(x => x.Id == claimId);
    }

    private async Task<HttpResponseMessage> SendRedeemRequestAsync(
        Guid claimId,
        Guid userId,
        string qrToken)
    {
        var client = _factory.CreateClient();

        client.DefaultRequestHeaders.Add(
            "X-Test-User-Id",
            userId.ToString());

        return await client.PostAsJsonAsync(
            $"/api/claims/{claimId}/redeem",
            new { qrToken });
    }
}
