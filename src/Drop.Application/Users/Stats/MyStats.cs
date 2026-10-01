using Drop.Application.Authentication;

namespace Drop.Application.Users.Stats;

/// <param name="Saved">Sum of (original − deal price) over used drops that had a price.</param>
public sealed record MyStatsResponse(
    int Claimed,
    int Redeemed,
    decimal Saved);

public interface IMyStatsQuery
{
    Task<MyStatsResponse> GetAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class GetMyStatsService
{
    private readonly IMyStatsQuery _query;
    private readonly ICurrentUser _currentUser;

    public GetMyStatsService(IMyStatsQuery query, ICurrentUser currentUser)
    {
        _query = query;
        _currentUser = currentUser;
    }

    public Task<MyStatsResponse> ExecuteAsync(CancellationToken cancellationToken = default) =>
        _query.GetAsync(_currentUser.Id, cancellationToken);
}
