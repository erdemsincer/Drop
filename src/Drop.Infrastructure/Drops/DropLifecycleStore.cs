using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Drops.ManageDrop;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Drops;

internal sealed class DropLifecycleStore : IDropLifecycleStore
{
    private readonly DropDbContext _dbContext;

    public DropLifecycleStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<DropLifecycleResponse> EndAsync(
        Guid dropId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return ExecuteAsync(dropId, now, cancel: false, cancellationToken);
    }

    public Task<DropLifecycleResponse> CancelAsync(
        Guid dropId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        return ExecuteAsync(dropId, now, cancel: true, cancellationToken);
    }

    public async Task<DropLifecycleResponse> UpdateAsync(
        Guid dropId,
        UpdateDropRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var drop = await LockAsync(dropId, cancellationToken);

        var activeCount = await _dbContext.Claims.CountAsync(
            claim => claim.DropId == dropId && claim.Status == ClaimStatus.Active && claim.ExpiresAt > now,
            cancellationToken);

        var redeemedCount = await _dbContext.Claims.CountAsync(
            claim => claim.DropId == dropId && claim.Status == ClaimStatus.Redeemed,
            cancellationToken);

        drop.UpdateDetails(
            request.Title,
            request.Description,
            request.MinimumSpend,
            request.Capacity,
            activeCount + redeemedCount,
            now);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new DropLifecycleResponse(drop.Id, drop.Status, drop.EndsAt, activeCount, 0);
    }

    private async Task<Domain.Drops.Drop> LockAsync(Guid dropId, CancellationToken cancellationToken)
    {
        // Same row lock ClaimStore takes, so no claim can slip in mid-change.
        return await _dbContext.Drops
            .FromSqlInterpolated(
                $"""
                SELECT *
                FROM drops
                WHERE "Id" = {dropId}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Drop.NotFound, "Drop was not found.");
    }

    private async Task<DropLifecycleResponse> ExecuteAsync(
        Guid dropId,
        DateTimeOffset now,
        bool cancel,
        CancellationToken cancellationToken)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var drop = await LockAsync(dropId, cancellationToken);

        var activeClaims = await _dbContext.Claims
            .Where(claim =>
                claim.DropId == dropId &&
                claim.Status == ClaimStatus.Active &&
                claim.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        var released = 0;

        if (cancel)
        {
            drop.Cancel(now);

            foreach (var claim in activeClaims)
            {
                claim.Cancel();
            }

            released = activeClaims.Count;
        }
        else
        {
            drop.End(now);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new DropLifecycleResponse(
            drop.Id,
            drop.Status,
            drop.EndsAt,
            activeClaims.Count - released,
            released);
    }
}
