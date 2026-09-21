using Drop.Domain.Common;

namespace Drop.Domain.Branches;

public sealed class Branch : Entity
{
    private Branch()
    {
    }

    public Branch(
        Guid businessId,
        string name,
        Location location)
    {
        if (businessId == Guid.Empty)
        {
            throw new ArgumentException(
                "Business id cannot be empty.",
                nameof(businessId));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Branch name cannot be empty.",
                nameof(name));
        }

        BusinessId = businessId;
        Name = name.Trim();
        Location = location
            ?? throw new ArgumentNullException(nameof(location));
    }

    public Guid BusinessId { get; private set; }

    public string Name { get; private set; } = null!;

    public Location Location { get; private set; } = null!;
}
