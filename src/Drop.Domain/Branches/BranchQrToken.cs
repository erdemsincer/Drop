using Drop.Domain.Common;

namespace Drop.Domain.Branches;

public sealed class BranchQrToken : Entity
{
    private BranchQrToken()
    {
    }

    public BranchQrToken(
        Guid branchId,
        string tokenHash,
        DateTimeOffset createdAt)
    {
        if (branchId == Guid.Empty)
        {
            throw new ArgumentException(
                "Branch id cannot be empty.",
                nameof(branchId));
        }

        if (string.IsNullOrWhiteSpace(tokenHash))
        {
            throw new ArgumentException(
                "Token hash cannot be empty.",
                nameof(tokenHash));
        }

        BranchId = branchId;
        TokenHash = tokenHash;
        CreatedAt = createdAt;
        IsActive = true;
    }

    public Guid BranchId { get; private set; }

    public string TokenHash { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? RevokedAt { get; private set; }

    public bool IsActive { get; private set; }

    public void Revoke(DateTimeOffset now)
    {
        if (!IsActive)
        {
            return;
        }

        IsActive = false;
        RevokedAt = now;
    }
}
