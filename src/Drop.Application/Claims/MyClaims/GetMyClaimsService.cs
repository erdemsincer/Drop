using Drop.Application.Authentication;

namespace Drop.Application.Claims.MyClaims;

public sealed class GetMyClaimsService
{
    private readonly IMyClaimsQuery _query;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public GetMyClaimsService(
        IMyClaimsQuery query,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _query = query;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public Task<IReadOnlyList<MyClaimResponse>> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        return _query.GetAsync(_currentUser.Id, _timeProvider.GetUtcNow(), cancellationToken);
    }
}
