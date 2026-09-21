using Drop.Domain.Drops;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class ClaimConfiguration
    : IEntityTypeConfiguration<Claim>
{
    public void Configure(EntityTypeBuilder<Claim> builder)
    {
        builder.ToTable("claims");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.ExpiresAt)
            .IsRequired();

        builder.Property(x => x.RedeemedAt);

        builder.HasOne<Domain.Drops.Drop>()
            .WithMany()
            .HasForeignKey(x => x.DropId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.DropId);

        builder.HasIndex(x => new
        {
            x.DropId,
            x.UserId
        })
        .IsUnique();

        builder.HasIndex(x => new
        {
            x.DropId,
            x.Status
        });
    }
}
