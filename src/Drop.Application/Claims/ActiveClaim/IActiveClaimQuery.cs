namespace Drop.Application.Features.Claims.ActiveClaim;
public interface IActiveClaimQuery
{
    Task<ActiveClaimResponse?> GetAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}