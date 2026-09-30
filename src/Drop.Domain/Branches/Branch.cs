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

    /// <summary>
    /// Set while the branch is closed (moved out, shut for renovation...).
    /// A closed branch keeps its history but can't publish drops.
    /// </summary>
    public DateTimeOffset? ClosedAt { get; private set; }

    public bool IsClosed => ClosedAt is not null;

    public void Close(DateTimeOffset now)
    {
        if (IsClosed)
            throw new BranchDomainException("branch.already_closed", "Branch is already closed.");

        ClosedAt = now;
    }

    public void Reopen()
    {
        if (!IsClosed)
            throw new BranchDomainException("branch.not_closed", "Branch is not closed.");

        ClosedAt = null;
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException(
                "Branch name cannot be empty.",
                nameof(name));
        }

        Name = name.Trim();
    }

    public void Relocate(Location location)
    {
        Location = location
            ?? throw new ArgumentNullException(nameof(location));
    }
}
