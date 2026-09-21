using Drop.Domain.Common;

namespace Drop.Domain.Drops;

public enum ClaimStatus
{
    Active = 1,
    Expired = 2,
    Redeemed = 3
}

public sealed class Claim : Entity
{
    private Claim()
    {
    }

    public Claim(
        Guid dropId,
        Guid userId,
        DateTimeOffset createdAt,
        TimeSpan claimDuration)
    {
        if (dropId == Guid.Empty)
            throw new ArgumentException("Drop id cannot be empty.");

        if (userId == Guid.Empty)
            throw new ArgumentException("User id cannot be empty.");

        if (claimDuration <= TimeSpan.Zero)
            throw new ArgumentException("Claim duration must be positive.");

        DropId = dropId;
        UserId = userId;
        Status = ClaimStatus.Active;
        CreatedAt = createdAt;
        ExpiresAt = createdAt.Add(claimDuration);
    }

    public Guid DropId { get; private set; }

    public Guid UserId { get; private set; }

    public ClaimStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? RedeemedAt { get; private set; }

    public void Redeem(DateTimeOffset now)
    {
        if (Status == ClaimStatus.Redeemed)
        {
            throw new ClaimDomainException(
                "claim.already_redeemed",
                "Claim has already been redeemed.");
        }

        if (Status == ClaimStatus.Expired || now >= ExpiresAt)
        {
            Status = ClaimStatus.Expired;

            throw new ClaimDomainException(
                "claim.expired",
                "Claim has expired.");
        }

        Status = ClaimStatus.Redeemed;
        RedeemedAt = now;
    }
}
