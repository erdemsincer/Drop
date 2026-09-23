using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Drops.GetBranchDrops;

public sealed class GetBranchDropsService
{
    private readonly IBranchDropsQuery _query;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public GetBranchDropsService(
        IBranchDropsQuery query,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _query = query;
        _accessService = accessService;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<IReadOnlyList<BusinessDropResponse>> ExecuteAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        if (!await _query.BranchExistsAsync(branchId, cancellationToken))
        {
            throw new NotFoundException(
                ErrorCodes.Branch.NotFound,
                "Branch was not found.");
        }

        var role = await _accessService.GetBranchRoleAsync(
            _currentUser.Id,
            branchId,
            cancellationToken);

        if (role is null)
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot view this branch.");
        }

        return await _query.GetAsync(
            branchId,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
