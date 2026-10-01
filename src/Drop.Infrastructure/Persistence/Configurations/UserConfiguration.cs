using Drop.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration
    : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email)
            .HasMaxLength(320)
            .IsRequired();

        builder.Property(x => x.PasswordHash)
            .HasMaxLength(500);

        builder.Property(x => x.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasIndex(x => x.Email).IsUnique();
    }
}
