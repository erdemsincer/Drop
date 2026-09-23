using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Drops.ManageDrop;

public sealed class ManageDropService
{
    private readonly IDropRepository _dropRepository;
    private readonly IDropLifecycleStore _lifecycleStore;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public ManageDropService(
        IDropRepository dropRepository,
        IDropLifecycleStore lifecycleStore,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _dropRepository = dropRepository;
        _lifecycleStore = lifecycleStore;
        _accessService = accessService;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<DropLifecycleResponse> EndAsync(
        Guid dropId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageAsync(dropId, cancellationToken);

        return await _lifecycleStore.EndAsync(dropId, _timeProvider.GetUtcNow(), cancellationToken);
    }

    public async Task<DropLifecycleResponse> CancelAsync(
        Guid dropId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageAsync(dropId, cancellationToken);

        return await _lifecycleStore.CancelAsync(dropId, _timeProvider.GetUtcNow(), cancellationToken);
    }

    public async Task<DropLifecycleResponse> UpdateAsync(
        Guid dropId,
        UpdateDropRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageAsync(dropId, cancellationToken);

        return await _lifecycleStore.UpdateAsync(dropId, request, _timeProvider.GetUtcNow(), cancellationToken);
    }

    private async Task EnsureCanManageAsync(Guid dropId, CancellationToken cancellationToken)
    {
        var drop = await _dropRepository.GetByIdAsync(dropId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Drop.NotFound, "Drop was not found.");

        if (!await _accessService.CanManageBranchAsync(_currentUser.Id, drop.BranchId, cancellationToken))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot manage this drop.");
        }
    }
}
