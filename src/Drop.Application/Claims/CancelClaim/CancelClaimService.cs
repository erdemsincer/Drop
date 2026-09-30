using Drop.Application.Authentication;

namespace Drop.Application.Claims.CancelClaim;

public sealed class CancelClaimService
{
    private readonly IClaimStore _claimStore;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public CancelClaimService(
        IClaimStore claimStore,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _claimStore = claimStore;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public Task ExecuteAsync(
        Guid claimId,
        CancellationToken cancellationToken = default)
    {
        return _claimStore.WithdrawAsync(
            claimId,
            _currentUser.Id,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
