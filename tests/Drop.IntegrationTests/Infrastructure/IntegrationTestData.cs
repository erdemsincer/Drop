using Drop.Domain.Branches;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Domain.Users;
using Drop.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.IntegrationTests.Infrastructure;

/// <summary>
/// Helper to create common test data scenarios (businesses, branches, drops, users).
/// </summary>
public static class IntegrationTestData
{
    /// <summary>
    /// Creates a complete scenario for claim testing: business, branch, and drop.
    /// </summary>
    public static async Task<ClaimScenario> CreateClaimScenarioAsync(
        DropApiFactory factory,
        int capacity)
    {
        using var scope = factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

        var now = DateTimeOffset.UtcNow;
        
        // Use GUID in email to ensure uniqueness across test runs
        var uniqueId = Guid.NewGuid().ToString("N").Substring(0, 8);

        var user = new User(
            $"owner-{uniqueId}@drop.test",
            "test-password-hash",
            "Drop",
            "Owner",
            now);

        var business = new Business("Drop Coffee");

        var member = new BusinessMember(
            business.Id,
            user.Id,
            BusinessMemberRole.Owner);

        var branch = new Branch(
            business.Id,
            "Merkez",
            new Location(37.0005, 35.3200));

        var drop = new Domain.Drops.Drop(
            branch.Id,
            "Concurrency Test Drop",
            null,
            null,
            capacity,
            TimeSpan.FromMinutes(60),
            TimeSpan.FromMinutes(15));

        drop.Activate(now);

        dbContext.Users.Add(user);
        dbContext.Businesses.Add(business);
        dbContext.BusinessMembers.Add(member);
        dbContext.Branches.Add(branch);
        dbContext.Drops.Add(drop);

        await dbContext.SaveChangesAsync();

        return new ClaimScenario(drop.Id, branch.Id);
    }

    /// <summary>
    /// Creates multiple test users for concurrent claim testing.
    /// </summary>
    public static async Task<IReadOnlyList<Guid>> CreateUsersAsync(
        DropApiFactory factory,
        int count)
    {
        using var scope = factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

        var now = DateTimeOffset.UtcNow;
        
        // Use GUID prefix to ensure uniqueness across test runs
        var uniquePrefix = Guid.NewGuid().ToString("N").Substring(0, 8);

        var users = Enumerable
            .Range(1, count)
            .Select(index =>
                new User(
                    $"user{index}-{uniquePrefix}@drop.test",
                    "test-password-hash",
                    "Test",
                    $"User{index}",
                    now))
            .ToList();

        dbContext.Users.AddRange(users);

        await dbContext.SaveChangesAsync();

        return users.Select(x => x.Id).ToList();
    }
}

/// <summary>
/// Represents a scenario for testing claims (drop, branch IDs).
/// </summary>
public sealed record ClaimScenario(
    Guid DropId,
    Guid BranchId);
