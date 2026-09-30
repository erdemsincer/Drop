using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Branches;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Drops.CreateDrop;

public sealed class CreateDropService
{
    private readonly IBranchRepository _branchRepository;
    private readonly IBusinessRepository _businessRepository;
    private readonly IDropRepository _dropRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;

    public CreateDropService(
        IBranchRepository branchRepository,
        IBusinessRepository businessRepository,
        IDropRepository dropRepository,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider,
        IBusinessAccessService accessService,
        ICurrentUser currentUser)
    {
        _branchRepository = branchRepository;
        _businessRepository = businessRepository;
        _dropRepository = dropRepository;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
        _accessService = accessService;
        _currentUser = currentUser;
    }

    public async Task<CreateDropResponse> ExecuteAsync(
        Guid branchId,
        CreateDropRequest request,
        CancellationToken cancellationToken = default)
    {
        var branch = await _branchRepository.GetByIdAsync(
            branchId,
            cancellationToken);

        if (branch is null)
        {
            throw new NotFoundException(
                ErrorCodes.Branch.NotFound,
                "Branch was not found.");
        }

        var canManage = await _accessService.CanManageBranchAsync(
            _currentUser.Id,
            branchId,
            cancellationToken);

        if (!canManage)
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot manage this business.");
        }

        if (branch.IsClosed)
        {
            throw new ConflictException(
                ErrorCodes.Branch.Closed,
                "Reopen the branch before publishing drops.");
        }

        var business = await _businessRepository.GetByBranchIdAsync(branchId, cancellationToken);

        if (business is null || !business.CanPublishDrops)
        {
            throw new ConflictException(
                ErrorCodes.Business.NotApproved,
                "The business must be approved before publishing drops.");
        }

        var drop = new Domain.Drops.Drop(
            branchId,
            request.Title,
            request.Description,
            request.MinimumSpend,
            request.Capacity,
            TimeSpan.FromMinutes(request.DurationMinutes),
            TimeSpan.FromMinutes(request.ClaimDurationMinutes));

        var now = _timeProvider.GetUtcNow();

        // A start within the next minute is treated as "now": the sweep runs every minute anyway.
        if (request.StartsAt is { } startsAt && startsAt > now.AddMinutes(1))
            drop.Schedule(startsAt, now);
        else
            drop.Activate(now);

        await _dropRepository.AddAsync(
            drop,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return new CreateDropResponse(
            drop.Id,
            drop.BranchId,
            drop.Title,
            drop.Capacity,
            drop.StartsAt!.Value,
            drop.EndsAt!.Value,
            drop.Status);
    }
}
