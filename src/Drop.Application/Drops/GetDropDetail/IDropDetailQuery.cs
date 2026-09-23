namespace Drop.Application.Features.Drops.GetDropDetail;

public interface IDropDetailQuery
{
    Task<DropDetailResponse?> GetAsync(
        Guid dropId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}