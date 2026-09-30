using Drop.Domain.Businesses;
using Drop.Domain.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Drop.Infrastructure.Persistence.Configurations;

internal sealed class BusinessFollowConfiguration
    : IEntityTypeConfiguration<BusinessFollow>
{
    public void Configure(EntityTypeBuilder<BusinessFollow> builder)
    {
        builder.ToTable("business_follows");

        builder.HasKey(x => x.Id);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Business>()
            .WithMany()
            .HasForeignKey(x => x.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.UserId, x.BusinessId }).IsUnique();

        // Fan-out on a new drop reads followers by business.
        builder.HasIndex(x => x.BusinessId);
    }
}
