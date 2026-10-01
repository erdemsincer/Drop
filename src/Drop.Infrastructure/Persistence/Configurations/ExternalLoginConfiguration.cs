using Drop.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class ExternalLoginConfiguration
    : IEntityTypeConfiguration<ExternalLogin>
{
    public void Configure(EntityTypeBuilder<ExternalLogin> builder)
    {
        builder.ToTable("external_logins");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Provider)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.Subject)
            .HasMaxLength(ExternalLogin.MaxSubjectLength)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.Provider, x.Subject }).IsUnique();

        // One Apple and one Google account per user.
        builder.HasIndex(x => new { x.UserId, x.Provider }).IsUnique();
    }
}
