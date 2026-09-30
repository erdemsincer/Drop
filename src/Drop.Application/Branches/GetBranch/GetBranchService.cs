using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Businesses;

namespace Drop.Application.Branches.GetBranch;

public sealed class GetBranchService
{
    private readonly IBranchDetailQuery _query;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;

    public GetBranchService(
        IBranchDetailQuery query,
        IBusinessAccessService accessService,
        ICurrentUser currentUser)
    {
        _query = query;
        _accessService = accessService;
        _currentUser = currentUser;
    }

    public async Task<BranchDetailResponse> ExecuteAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        var branch = await _query.GetAsync(branchId, cancellationToken)
            ?? throw new NotFoundException(
                ErrorCodes.Branch.NotFound,
                "Branch was not found.");

        var role = await _accessService.GetBusinessRoleAsync(
            _currentUser.Id,
            branch.BusinessId,
            cancellationToken)
            ?? throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot view this branch.");

        return new BranchDetailResponse(
            branch.Id,
            branch.Name,
            branch.BusinessId,
            branch.BusinessName,
            branch.Latitude,
            branch.Longitude,
            role,
            BusinessRoles.CanManage(role),
            BusinessRoles.CanShowQr(role),
            branch.BusinessStatus,
            branch.IsClosed,
            BusinessRoles.CanManage(role) && branch.BusinessStatus == BusinessStatus.Approved && !branch.IsClosed);
    }
}
