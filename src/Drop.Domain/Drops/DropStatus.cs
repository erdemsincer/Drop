namespace Drop.Domain.Drops;

public enum DropStatus
{
    Draft = 1,
    Active = 2,
    Expired = 3,
    Cancelled = 4,

    /// <summary>Created with a future start; the expiration sweep activates it at StartsAt.</summary>
    Scheduled = 5
}
