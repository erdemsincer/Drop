using System.Data;
using Drop.Application.Claims;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Claims;

internal sealed class ClaimStore : IClaimStore
{
    private readonly DropDbContext _dbContext;

    public ClaimStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CreateClaimResult> TryCreateAsync(
        Guid dropId,
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

        var drop = await _dbContext.Drops
            .FromSqlInterpolated(
                $"""
                SELECT *
                FROM drops
                WHERE "Id" = {dropId}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(cancellationToken);

        if (drop is null)
        {
            throw new NotFoundException(
                ErrorCodes.Drop.NotFound,
                "Drop was not found.");
        }

        if (drop.Status != DropStatus.Active ||
            drop.StartsAt is null ||
            drop.EndsAt is null ||
            now < drop.StartsAt ||
            now >= drop.EndsAt)
        {
            throw new ConflictException(
                ErrorCodes.Drop.NotActive,
                "Drop is not active.");
        }

        var alreadyClaimed =
            await _dbContext.Claims.AnyAsync(
                x => x.DropId == dropId &&
                     x.UserId == userId,
                cancellationToken);

        if (alreadyClaimed)
        {
            throw new ConflictException(
                ErrorCodes.Claim.AlreadyExists,
                "User has already claimed this drop.");
        }

        var occupiedCount =
            await _dbContext.Claims.CountAsync(
                x =>
                    x.DropId == dropId &&
                    (
                        x.Status == ClaimStatus.Redeemed ||
                        (
                            x.Status == ClaimStatus.Active &&
                            x.ExpiresAt > now
                        )
                    ),
                cancellationToken);

        if (occupiedCount >= drop.Capacity)
        {
            throw new ConflictException(
                ErrorCodes.Drop.SoldOut,
                "Drop has no remaining capacity.");
        }

        var claim = new Claim(
            drop.Id,
            userId,
            now,
            drop.ClaimDuration);

        await _dbContext.Claims.AddAsync(
            claim,
            cancellationToken);

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        await transaction.CommitAsync(
            cancellationToken);

        return new CreateClaimResult(
            claim.Id,
            claim.DropId,
            claim.ExpiresAt,
            drop.Capacity - occupiedCount - 1);
    }
}
