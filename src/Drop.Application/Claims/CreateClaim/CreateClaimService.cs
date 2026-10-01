using Drop.Application.Authentication;
using Drop.Application.Claims;
using Drop.Application.Notifications.Push;

namespace Drop.Application.Claims.CreateClaim;

public sealed class CreateClaimService
{
    private readonly IClaimStore _claimStore;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;
    private readonly IClaimCreatedNotifier _claimCreatedNotifier;

    public CreateClaimService(
        IClaimStore claimStore,
        ICurrentUser currentUser,
        TimeProvider timeProvider,
        IClaimCreatedNotifier claimCreatedNotifier)
    {
        _claimStore = claimStore;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
        _claimCreatedNotifier = claimCreatedNotifier;
    }

    public async Task<CreateClaimResponse> ExecuteAsync(
        Guid dropId,
        CreateClaimRequest? request = null,
        CancellationToken cancellationToken = default)
    {
        if (dropId == Guid.Empty)
        {
            throw new ArgumentException("Drop id cannot be empty.", nameof(dropId));
        }

        var userId = _currentUser.Id;

        var result = await _claimStore.TryCreateAsync(
            dropId,
            userId,
            _timeProvider.GetUtcNow(),
            request?.Latitude,
            request?.Longitude,
            cancellationToken);

        _claimCreatedNotifier.Enqueue(result.ClaimId);

        return new CreateClaimResponse(
            result.ClaimId,
            result.DropId,
            result.ExpiresAt,
            result.RemainingCapacity);
    }
}
