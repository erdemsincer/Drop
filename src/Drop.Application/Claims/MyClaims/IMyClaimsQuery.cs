namespace Drop.Application.Claims.MyClaims;

public interface IMyClaimsQuery
{
    Task<IReadOnlyList<MyClaimResponse>> GetAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
