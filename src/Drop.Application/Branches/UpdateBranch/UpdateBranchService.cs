using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Branches.CreateBranch;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Branches;

namespace Drop.Application.Branches.UpdateBranch;

public sealed class UpdateBranchService
{
    private readonly IBranchRepository _branchRepository;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBranchService(
        IBranchRepository branchRepository,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork)
    {
        _branchRepository = branchRepository;
        _accessService = accessService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<CreateBranchResponse> ExecuteAsync(
        Guid branchId,
        UpdateBranchRequest request,
        CancellationToken cancellationToken = default)
    {
        var branch = await _branchRepository.GetByIdAsync(branchId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Branch.NotFound, "Branch was not found.");

        if (!await _accessService.CanManageBranchAsync(_currentUser.Id, branchId, cancellationToken))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot manage this branch.");
        }

        branch.Rename(request.Name);

        if (request.Latitude is { } latitude && request.Longitude is { } longitude)
        {
            branch.Relocate(new Location(latitude, longitude));
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateBranchResponse(
            branch.Id,
            branch.BusinessId,
            branch.Name,
            branch.Location.Latitude,
            branch.Location.Longitude);
    }
}
