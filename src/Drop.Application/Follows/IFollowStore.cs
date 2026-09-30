namespace Drop.Application.Follows;

public sealed record FollowedBusinessResponse(Guid BusinessId, string Name, DateTimeOffset FollowedAt);

public interface IFollowStore
{
    Task<bool> BusinessExistsAsync(Guid businessId, CancellationToken cancellationToken = default);

    /// <summary>Idempotent: following twice is a no-op.</summary>
    Task FollowAsync(Guid userId, Guid businessId, DateTimeOffset now, CancellationToken cancellationToken = default);

    /// <summary>Idempotent: unfollowing something not followed is a no-op.</summary>
    Task UnfollowAsync(Guid userId, Guid businessId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FollowedBusinessResponse>> ListAsync(Guid userId, CancellationToken cancellationToken = default);
}
