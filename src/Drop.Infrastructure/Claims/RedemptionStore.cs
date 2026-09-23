using Drop.Application.Claims;
using Drop.Application.Claims.RedeemClaim;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Claims;

internal sealed class RedemptionStore : IRedemptionStore
{
    private readonly DropDbContext _dbContext;

    public RedemptionStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RedeemClaimResponse> RedeemAsync(
        Guid claimId,
        Guid userId,
        string qrTokenHash,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(cancellationToken);

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
                "You cannot redeem this claim.");
        }

        var drop = await _dbContext.Drops
            .SingleOrDefaultAsync(x => x.Id == claim.DropId, cancellationToken);

        if (drop is null)
        {
            throw new NotFoundException(
                ErrorCodes.Drop.NotFound,
                "Drop was not found.");
        }

        var validQr = await _dbContext.BranchQrTokens
            .AnyAsync(
                token =>
                    token.BranchId == drop.BranchId &&
                    token.TokenHash == qrTokenHash &&
                    token.IsActive,
                cancellationToken);

        if (!validQr)
        {
            throw new ConflictException(
                ErrorCodes.Qr.Invalid,
                "QR code is not valid for this branch.");
        }

        try
        {
            claim.Redeem(now);
        }
        catch (ClaimDomainException ex)
        {
            throw new ConflictException(ex.Code, ex.Message);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new RedeemClaimResponse(
            claim.Id,
            claim.DropId,
            claim.RedeemedAt!.Value);
    }
}
