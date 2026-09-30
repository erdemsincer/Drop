using Drop.Application.Security;
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
        user.MarkEmailVerified(now);

        var business = new Business("Drop Coffee", now);
        business.Approve(now);

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

        return new ClaimScenario(drop.Id, branch.Id, business.Id, user.Id);
    }

    /// <summary>
    /// The branch QR payload a business device would display at the given time
    /// (defaults to now), produced by the real signing service.
    /// </summary>
    public static string QrPayloadFor(
        DropApiFactory factory,
        Guid branchId,
        DateTimeOffset? at = null)
    {
        var qrCodes = factory.Services.GetRequiredService<IBranchQrCodeService>();

        return qrCodes.Generate(branchId, at ?? DateTimeOffset.UtcNow).Payload;
    }

    /// <summary>
    /// Creates a claim directly in the database, bypassing capacity checks.
    /// </summary>
    public static async Task<Guid> CreateClaimAsync(
        DropApiFactory factory,
        Guid dropId,
        Guid userId,
        DateTimeOffset createdAt,
        TimeSpan claimDuration)
    {
        using var scope = factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

        var claim = new Claim(
            dropId,
            userId,
            createdAt,
            claimDuration);

        dbContext.Claims.Add(claim);

        await dbContext.SaveChangesAsync();

        return claim.Id;
    }

    /// <summary>
    /// Adds an existing user to a business with the given role.
    /// </summary>
    public static async Task AddMemberAsync(
        DropApiFactory factory,
        Guid businessId,
        Guid userId,
        BusinessMemberRole role)
    {
        using var scope = factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider
                .GetRequiredService<DropDbContext>();

        dbContext.BusinessMembers.Add(new BusinessMember(businessId, userId, role));

        await dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// The platform admin (e-mail listed in Admin:Emails), created on first use.
    /// </summary>
    public static async Task<Guid> GetOrCreateAdminAsync(DropApiFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DropDbContext>();

        var existing = dbContext.Users.FirstOrDefault(x => x.Email == DropApiFactory.AdminEmail);
        if (existing is not null) return existing.Id;

        var admin = new User(DropApiFactory.AdminEmail, "test-password-hash", "Platform", "Admin", DateTimeOffset.UtcNow);
        dbContext.Users.Add(admin);

        try
        {
            await dbContext.SaveChangesAsync();
            return admin.Id;
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            // Another test class created it concurrently.
            using var retry = factory.Services.CreateScope();
            return retry.ServiceProvider.GetRequiredService<DropDbContext>()
                .Users.First(x => x.Email == DropApiFactory.AdminEmail).Id;
        }
    }

    /// <summary>
    /// Creates multiple test users for concurrent claim testing.
    /// </summary>
    /// <param name="emailVerified">
    /// Seeded users stand for established accounts, so they are verified unless a test says otherwise.
    /// </param>
    public static async Task<IReadOnlyList<Guid>> CreateUsersAsync(
        DropApiFactory factory,
        int count,
        bool emailVerified = true)
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

        if (emailVerified)
        {
            users.ForEach(user => user.MarkEmailVerified(now));
        }

        dbContext.Users.AddRange(users);

        await dbContext.SaveChangesAsync();

        return users.Select(x => x.Id).ToList();
    }
}

/// <summary>
/// Represents a scenario for testing claims (drop, branch, business and owner IDs).
/// </summary>
public sealed record ClaimScenario(
    Guid DropId,
    Guid BranchId,
    Guid BusinessId,
    Guid OwnerId);
