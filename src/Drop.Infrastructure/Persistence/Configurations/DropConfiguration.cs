using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class DropConfiguration
    : IEntityTypeConfiguration<Domain.Drops.Drop>
{
    public void Configure(
        EntityTypeBuilder<Domain.Drops.Drop> builder)
    {
        builder.ToTable("drops");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.MinimumSpend)
            .HasPrecision(18, 2);

        builder.Property(x => x.OriginalPrice)
            .HasPrecision(18, 2);

        builder.Property(x => x.DealPrice)
            .HasPrecision(18, 2);

        // Photos are shared between republished drops; deleting one just leaves the drop without.
        builder.HasOne<Domain.Media.MediaFile>()
            .WithMany()
            .HasForeignKey(x => x.PhotoId)
            .OnDelete(DeleteBehavior.SetNull);

        // Deleting a schedule cancels its upcoming drops; past ones simply lose the link.
        builder.HasOne<Domain.Drops.DropSchedule>()
            .WithMany()
            .HasForeignKey(x => x.ScheduleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(x => x.Capacity)
            .IsRequired();

        builder.Property(x => x.Duration)
            .IsRequired();

        builder.Property(x => x.ClaimDuration)
            .IsRequired();

        builder.Property(x => x.Category)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasIndex(x => x.Category);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.HasOne<Domain.Branches.Branch>()
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.BranchId);

        builder.HasIndex(x => new
        {
            x.Status,
            x.EndsAt
        });
    }
}
