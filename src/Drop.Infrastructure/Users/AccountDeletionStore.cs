using Drop.Application.Users.DeleteAccount;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Users;

internal sealed class AccountDeletionStore : IAccountDeletionStore
{
    private readonly DropDbContext _dbContext;

    public AccountDeletionStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task DeleteAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Free the places this user was holding.
        await _dbContext.Claims
            .Where(claim => claim.UserId == userId && claim.Status == ClaimStatus.Active)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(claim => claim.Status, ClaimStatus.Cancelled),
                cancellationToken);

        var ownedBusinessIds = await _dbContext.BusinessMembers
            .Where(member => member.UserId == userId && member.Role == BusinessMemberRole.Owner)
            .Select(member => member.BusinessId)
            .ToListAsync(cancellationToken);

        // FK cascades remove branches, drops, their claims and memberships.
        await _dbContext.Businesses
            .Where(business => ownedBusinessIds.Contains(business.Id))
            .ExecuteDeleteAsync(cancellationToken);

        // Cascades memberships, refresh tokens and reset codes.
        await _dbContext.Users
            .Where(user => user.Id == userId)
            .ExecuteDeleteAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }
}
