using Drop.Domain.Branches;

namespace Drop.Application.Branches;

public interface IBranchQrTokenRepository
{
    Task AddAsync(
        BranchQrToken token,
        CancellationToken cancellationToken = default);

    Task RevokeActiveTokensAsync(
        Guid branchId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
