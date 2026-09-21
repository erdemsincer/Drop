using Drop.Application.Branches;
using Drop.Domain.Branches;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Repositories;

internal sealed class BranchQrTokenRepository : IBranchQrTokenRepository
{
    private readonly DropDbContext _dbContext;

    public BranchQrTokenRepository(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(
        BranchQrToken token,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.BranchQrTokens.AddAsync(
            token,
            cancellationToken);
    }

    public async Task RevokeActiveTokensAsync(
        Guid branchId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var activeTokens = await _dbContext.BranchQrTokens
            .Where(x => x.BranchId == branchId && x.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.Revoke(now);
        }
    }
}
