using Drop.Application.Authentication;

namespace Drop.Application.Features.Claims.ActiveClaim;

public sealed class GetActiveClaimService
{
    private readonly IActiveClaimQuery _query;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public GetActiveClaimService(
        IActiveClaimQuery query,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _query = query;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<ActiveClaimResponse?> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        return await _query.GetAsync(
            _currentUser.Id,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
