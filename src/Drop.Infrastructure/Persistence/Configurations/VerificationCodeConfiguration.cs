using Drop.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class VerificationCodeConfiguration
    : IEntityTypeConfiguration<VerificationCode>
{
    public void Configure(EntityTypeBuilder<VerificationCode> builder)
    {
        builder.ToTable("verification_codes");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Purpose)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.CodeHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.Purpose, x.CreatedAt });
    }
}
