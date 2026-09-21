using Drop.Application.Authentication;
using Drop.Application.Claims;

namespace Drop.Application.Claims.CreateClaim;

public sealed class CreateClaimService
{
    private readonly IClaimStore _claimStore;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public CreateClaimService(
        IClaimStore claimStore,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _claimStore = claimStore;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<CreateClaimResponse> ExecuteAsync(
        Guid dropId,
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
            cancellationToken);

        return new CreateClaimResponse(
            result.ClaimId,
            result.DropId,
            result.ExpiresAt,
            result.RemainingCapacity);
    }
}
