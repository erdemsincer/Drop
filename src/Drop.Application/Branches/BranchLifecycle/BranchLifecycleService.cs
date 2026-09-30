using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Branches;

namespace Drop.Application.Branches.BranchLifecycle;

public sealed class BranchLifecycleService
{
    private readonly IBranchRepository _branchRepository;
    private readonly IBranchLifecycleStore _store;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public BranchLifecycleService(
        IBranchRepository branchRepository,
        IBranchLifecycleStore store,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _branchRepository = branchRepository;
        _store = store;
        _accessService = accessService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    public async Task CloseAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        var branch = await GetManagedBranchAsync(branchId, cancellationToken);

        branch.Close(_timeProvider.GetUtcNow());

        await _store.SaveClosedAsync(branch, cancellationToken);
    }

    public async Task ReopenAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        var branch = await GetManagedBranchAsync(branchId, cancellationToken);

        branch.Reopen();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Branch> GetManagedBranchAsync(Guid branchId, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(branchId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Branch.NotFound, "Branch was not found.");

        if (!await _accessService.CanManageBranchAsync(_currentUser.Id, branchId, cancellationToken))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot manage this branch.");
        }

        return branch;
    }
}
