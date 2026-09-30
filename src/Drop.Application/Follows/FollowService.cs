using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Follows;

public sealed class FollowService
{
    private readonly IFollowStore _store;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public FollowService(IFollowStore store, ICurrentUser currentUser, TimeProvider timeProvider)
    {
        _store = store;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task FollowAsync(Guid businessId, CancellationToken cancellationToken = default)
    {
        if (!await _store.BusinessExistsAsync(businessId, cancellationToken))
        {
            throw new NotFoundException(ErrorCodes.Business.NotFound, "Business was not found.");
        }

        await _store.FollowAsync(_currentUser.Id, businessId, _timeProvider.GetUtcNow(), cancellationToken);
    }

    public Task UnfollowAsync(Guid businessId, CancellationToken cancellationToken = default) =>
        _store.UnfollowAsync(_currentUser.Id, businessId, cancellationToken);

    public Task<IReadOnlyList<FollowedBusinessResponse>> ListMineAsync(CancellationToken cancellationToken = default) =>
        _store.ListAsync(_currentUser.Id, cancellationToken);
}
