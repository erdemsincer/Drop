using Drop.Domain.Drops;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class DropScheduleConfiguration
    : IEntityTypeConfiguration<DropSchedule>
{
    public void Configure(EntityTypeBuilder<DropSchedule> builder)
    {
        builder.ToTable("drop_schedules");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.MinimumSpend).HasPrecision(18, 2);
        builder.Property(x => x.OriginalPrice).HasPrecision(18, 2);
        builder.Property(x => x.DealPrice).HasPrecision(18, 2);

        builder.Property(x => x.Category)
            .HasConversion<string>()
            .HasMaxLength(30);

        // Stored as the bitmask; the API speaks ISO weekday numbers.
        builder.Property(x => x.Days).HasConversion<int>();

        builder.HasOne<Domain.Branches.Branch>()
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Domain.Media.MediaFile>()
            .WithMany()
            .HasForeignKey(x => x.PhotoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.BranchId);
    }
}
