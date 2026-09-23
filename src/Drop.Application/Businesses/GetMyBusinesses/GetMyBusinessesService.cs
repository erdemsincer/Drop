using Drop.Application.Authentication;

namespace Drop.Application.Businesses.GetMyBusinesses;

public sealed class GetMyBusinessesService
{
    private readonly IMyBusinessesQuery _query;
    private readonly ICurrentUser _currentUser;

    public GetMyBusinessesService(
        IMyBusinessesQuery query,
        ICurrentUser currentUser)
    {
        _query = query;
        _currentUser = currentUser;
    }

    public Task<IReadOnlyList<MyBusinessResponse>> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        return _query.GetAsync(_currentUser.Id, cancellationToken);
    }
}
