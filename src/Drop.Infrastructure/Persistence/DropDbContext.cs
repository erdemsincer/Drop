using Drop.Application.Abstractions;
using Drop.Domain.Branches;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Persistence;

public sealed class DropDbContext : DbContext, IUnitOfWork
{
    public DropDbContext(DbContextOptions<DropDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Business> Businesses => Set<Business>();

    public DbSet<BusinessMember> BusinessMembers => Set<BusinessMember>();

    public DbSet<Branch> Branches => Set<Branch>();

    public DbSet<Domain.Drops.Drop> Drops => Set<Domain.Drops.Drop>();

    public DbSet<Claim> Claims => Set<Claim>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<VerificationCode> VerificationCodes => Set<VerificationCode>();

    public DbSet<BusinessFollow> BusinessFollows => Set<BusinessFollow>();

    public DbSet<Domain.Notifications.DeviceToken> DeviceTokens => Set<Domain.Notifications.DeviceToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(DropDbContext).Assembly);
    }
}
