using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Businesses.Profile;

public sealed record BusinessProfileBranch(
    Guid Id,
    string Name,
    double Latitude,
    double Longitude);

public sealed record BusinessProfileDrop(
    Guid Id,
    Guid BranchId,
    string BranchName,
    string Title,
    string Category,
    int Capacity,
    int RemainingCapacity,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    decimal? OriginalPrice,
    decimal? DealPrice,
    Guid? PhotoId);

/// <summary>The customer-facing page of a business: who they are, where, and what's on.</summary>
public sealed record BusinessProfileResponse(
    Guid Id,
    string Name,
    int FollowerCount,
    bool IsFollowing,
    double? Rating,
    int RatingCount,
    int RedeemedCount,
    IReadOnlyList<BusinessProfileBranch> Branches,
    IReadOnlyList<BusinessProfileDrop> LiveDrops,
    IReadOnlyList<BusinessProfileDrop> UpcomingDrops);

public interface IBusinessProfileQuery
{
    /// <summary>Null when the business doesn't exist or isn't approved (not public yet).</summary>
    Task<BusinessProfileResponse?> GetAsync(
        Guid businessId,
        Guid viewerId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}

public sealed class GetBusinessProfileService
{
    private readonly IBusinessProfileQuery _query;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public GetBusinessProfileService(IBusinessProfileQuery query, ICurrentUser currentUser, TimeProvider timeProvider)
    {
        _query = query;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<BusinessProfileResponse> ExecuteAsync(Guid businessId, CancellationToken cancellationToken = default) =>
        await _query.GetAsync(businessId, _currentUser.Id, _timeProvider.GetUtcNow(), cancellationToken)
        ?? throw new NotFoundException(ErrorCodes.Business.NotFound, "Business was not found.");
}
