using Drop.Domain.Common;

namespace Drop.Domain.Drops;

public enum ClaimStatus
{
    Active = 1,
    Expired = 2,
    Redeemed = 3,
    Cancelled = 4
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

    /// <summary>The price locked in when the drop was caught (matters for falling-price drops); null if unpriced.</summary>
    public decimal? Price { get; private set; }

    public void LockPrice(decimal? price) => Price = price;

    public Guid DropId { get; private set; }

    public Guid UserId { get; private set; }

    public ClaimStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? RedeemedAt { get; private set; }

    /// <summary>1–5 stars the customer gave after using the drop; null until rated.</summary>
    public int? Rating { get; private set; }

    public DateTimeOffset? RatedAt { get; private set; }

    /// <summary>Rates a used drop. Changing one's mind later simply overwrites the stars.</summary>
    public void Rate(int stars, DateTimeOffset now)
    {
        if (Status != ClaimStatus.Redeemed)
        {
            throw new ClaimDomainException(
                "claim.not_redeemed",
                "Only used drops can be rated.");
        }

        if (stars is < 1 or > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(stars), "Rating must be between 1 and 5.");
        }

        Rating = stars;
        RatedAt = now;
    }

    /// <summary>Withdraws an unused reservation because its drop was cancelled.</summary>
    public void Cancel()
    {
        if (Status == ClaimStatus.Active)
        {
            Status = ClaimStatus.Cancelled;
        }
    }

    /// <summary>
    /// The customer gives an unused reservation back, freeing its place on the drop.
    /// The same drop cannot be claimed again, so a place can't be held and re-held.
    /// </summary>
    public void Withdraw(DateTimeOffset now)
    {
        if (Status == ClaimStatus.Expired || (Status == ClaimStatus.Active && now >= ExpiresAt))
        {
            throw new ClaimDomainException(
                "claim.expired",
                "Claim has expired.");
        }

        if (Status != ClaimStatus.Active)
        {
            throw new ClaimDomainException(
                "claim.not_active",
                "Only active claims can be cancelled.");
        }

        Status = ClaimStatus.Cancelled;
    }

    public void Redeem(DateTimeOffset now)
    {
        // Expired is checked first: the expiration job may already have flipped
        // the status, and the customer should still hear "expired".
        if (Status == ClaimStatus.Expired || (Status == ClaimStatus.Active && now >= ExpiresAt))
        {
            throw new ClaimDomainException(
                "claim.expired",
                "Claim has expired.");
        }

        if (Status != ClaimStatus.Active)
        {
            throw new ClaimDomainException(
                "claim.not_active",
                "Only active claims can be redeemed.");
        }

        Status = ClaimStatus.Redeemed;
        RedeemedAt = now;
    }
}
