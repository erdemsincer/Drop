using Drop.Domain.Branches;
using Drop.Domain.Businesses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class BranchConfiguration
    : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.OwnsOne(x => x.Location, location =>
        {
            location.Property(l => l.Latitude)
                .HasColumnName("Latitude")
                .IsRequired();

            location.Property(l => l.Longitude)
                .HasColumnName("Longitude")
                .IsRequired();
        });

        builder.HasOne<Business>()
            .WithMany()
            .HasForeignKey(x => x.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.BusinessId);
    }
}
