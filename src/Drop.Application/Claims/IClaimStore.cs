namespace Drop.Application.Claims;

public interface IClaimStore
{
    Task<CreateClaimResult> TryCreateAsync(
        Guid dropId,
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
