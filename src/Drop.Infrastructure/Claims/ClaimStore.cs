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
        double? latitude,
        double? longitude,
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

        if (drop.IsMystery)
        {
            var branch = await _dbContext.Branches
                .Where(x => x.Id == drop.BranchId)
                .Select(x => new { x.Location.Latitude, x.Location.Longitude })
                .SingleAsync(cancellationToken);

            // Checked here, not only in the app: the hunt is the point.
            if (!Application.Drops.MysteryMask.IsWithinReach(branch.Latitude, branch.Longitude, latitude, longitude))
            {
                throw new ConflictException(
                    ErrorCodes.Drop.Locked,
                    $"Get within {Domain.Drops.Drop.MysteryUnlockMeters} m to open this mystery drop.");
            }
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

        var hasActiveClaim =
            await _dbContext.Claims.AnyAsync(
                x =>
                    x.UserId == userId &&
                    x.Status == ClaimStatus.Active &&
                    x.ExpiresAt > now,
                cancellationToken);

        if (hasActiveClaim)
        {
            throw new ConflictException(
                ErrorCodes.Claim.ActiveClaimExists,
                "User already has an active claim.");
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

    public async Task WithdrawAsync(
        Guid claimId,
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Locked so a cancel can't race a redemption of the same claim.
        var claim = await _dbContext.Claims
            .FromSqlInterpolated(
                $"""
                SELECT *
                FROM claims
                WHERE "Id" = {claimId}
                FOR UPDATE
                """)
            .SingleOrDefaultAsync(cancellationToken);

        if (claim is null)
        {
            throw new NotFoundException(
                ErrorCodes.Claim.NotFound,
                "Claim was not found.");
        }

        if (claim.UserId != userId)
        {
            throw new ForbiddenException(
                ErrorCodes.Claim.AccessDenied,
                "You cannot cancel this claim.");
        }

        try
        {
            claim.Withdraw(now);
        }
        catch (ClaimDomainException ex)
        {
            throw new ConflictException(ex.Code, ex.Message);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task RateAsync(
        Guid claimId,
        Guid userId,
        int stars,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var claim = await _dbContext.Claims.SingleOrDefaultAsync(x => x.Id == claimId, cancellationToken)
            ?? throw new NotFoundException(
                ErrorCodes.Claim.NotFound,
                "Claim was not found.");

        if (claim.UserId != userId)
        {
            throw new ForbiddenException(
                ErrorCodes.Claim.AccessDenied,
                "You cannot rate this claim.");
        }

        try
        {
            claim.Rate(stars, now);
        }
        catch (ClaimDomainException ex)
        {
            throw new ConflictException(ex.Code, ex.Message);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
