using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Branches;

namespace Drop.Application.Branches.CreateBranch;

public sealed class CreateBranchService
{
    private readonly IBusinessRepository _businessRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;

    public CreateBranchService(
        IBusinessRepository businessRepository,
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork,
        IBusinessAccessService accessService,
        ICurrentUser currentUser)
    {
        _businessRepository = businessRepository;
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
        _accessService = accessService;
        _currentUser = currentUser;
    }

    public async Task<CreateBranchResponse> ExecuteAsync(
        Guid businessId,
        CreateBranchRequest request,
        CancellationToken cancellationToken = default)
    {
        var businessExists =
            await _businessRepository.ExistsAsync(
                businessId,
                cancellationToken);

        if (!businessExists)
        {
            throw new NotFoundException(
                ErrorCodes.Business.NotFound,
                "Business was not found.");
        }

        var canManage = await _accessService.CanManageBusinessAsync(
            _currentUser.Id,
            businessId,
            cancellationToken);

        if (!canManage)
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot manage this business.");
        }

        var branch = new Branch(
            businessId,
            request.Name,
            new Location(
                request.Latitude,
                request.Longitude));

        await _branchRepository.AddAsync(
            branch,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return new CreateBranchResponse(
            branch.Id,
            branch.BusinessId,
            branch.Name,
            branch.Location.Latitude,
            branch.Location.Longitude);
    }
}
