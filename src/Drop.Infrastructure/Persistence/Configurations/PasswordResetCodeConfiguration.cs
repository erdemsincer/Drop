using Drop.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class PasswordResetCodeConfiguration
    : IEntityTypeConfiguration<PasswordResetCode>
{
    public void Configure(EntityTypeBuilder<PasswordResetCode> builder)
    {
        builder.ToTable("password_reset_codes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CodeHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.CreatedAt });
    }
}
