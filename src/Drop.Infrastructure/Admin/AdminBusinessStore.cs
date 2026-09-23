using Drop.Application.Admin;
using Drop.Domain.Businesses;
using Drop.Domain.Drops;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Admin;

internal sealed class AdminBusinessStore : IAdminBusinessStore
{
    private readonly DropDbContext _dbContext;

    public AdminBusinessStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<AdminBusinessResponse>> ListAsync(
        BusinessStatus? status,
        CancellationToken cancellationToken = default)
    {
        var businesses = _dbContext.Businesses.Where(business => status == null || business.Status == status);

        // Order on the entity: EF can't translate ordering on a projected record.
        // Oldest pending first so nobody waits forever; otherwise most recent change first.
        businesses = status == BusinessStatus.Pending
            ? businesses.OrderBy(business => business.CreatedAt)
            : businesses.OrderByDescending(business => business.StatusChangedAt);

        return await Project(businesses.Take(200)).ToListAsync(cancellationToken);
    }

    public Task<AdminBusinessResponse?> GetAsync(
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        return Project(_dbContext.Businesses.Where(business => business.Id == businessId))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task SaveStatusAsync(
        Business business,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        if (business.Status == BusinessStatus.Suspended)
        {
            var dropIds = _dbContext.Drops
                .Where(drop =>
                    (drop.Status == DropStatus.Active || drop.Status == DropStatus.Scheduled) &&
                    _dbContext.Branches.Any(branch => branch.Id == drop.BranchId && branch.BusinessId == business.Id))
                .Select(drop => drop.Id);

            await _dbContext.Claims
                .Where(claim => claim.Status == ClaimStatus.Active && dropIds.Contains(claim.DropId))
                .ExecuteUpdateAsync(s => s.SetProperty(claim => claim.Status, ClaimStatus.Cancelled), cancellationToken);

            await _dbContext.Drops
                .Where(drop => dropIds.Contains(drop.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(drop => drop.Status, DropStatus.Cancelled), cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    private IQueryable<AdminBusinessResponse> Project(IQueryable<Business> businesses) =>
        from business in businesses
        let owner = (
            from member in _dbContext.BusinessMembers
            join user in _dbContext.Users on member.UserId equals user.Id
            where member.BusinessId == business.Id && member.Role == BusinessMemberRole.Owner
            select new { Name = user.FirstName + " " + user.LastName, user.Email }
        ).FirstOrDefault()
        select new AdminBusinessResponse(
            business.Id,
            business.Name,
            business.Status,
            business.StatusReason,
            business.CreatedAt,
            business.StatusChangedAt,
            owner != null ? owner.Name : null,
            owner != null ? owner.Email : null,
            _dbContext.Branches.Count(branch => branch.BusinessId == business.Id));
}
