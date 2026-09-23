using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Branches.GetBranches;

public sealed class GetBranchesService
{
    private readonly IBranchListQuery _query;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public GetBranchesService(
        IBranchListQuery query,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _query = query;
        _accessService = accessService;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<IReadOnlyList<BranchListItemResponse>> ExecuteAsync(
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        if (!await _query.BusinessExistsAsync(businessId, cancellationToken))
        {
            throw new NotFoundException(
                ErrorCodes.Business.NotFound,
                "Business was not found.");
        }

        // Any member (Owner, Manager or Staff) may view.
        var role = await _accessService.GetBusinessRoleAsync(
            _currentUser.Id,
            businessId,
            cancellationToken);

        if (role is null)
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot view this business.");
        }

        return await _query.GetAsync(
            businessId,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
