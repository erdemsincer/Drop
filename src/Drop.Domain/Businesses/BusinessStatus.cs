namespace Drop.Domain.Businesses;

public enum BusinessStatus
{
    /// <summary>Just created; waiting for manual review. May set up branches but not publish drops.</summary>
    Pending = 1,

    Approved = 2,

    Rejected = 3,

    /// <summary>Previously approved, now blocked; its drops were withdrawn.</summary>
    Suspended = 4
}
