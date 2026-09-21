namespace Drop.Application.Drops;

public interface IDropRepository
{
    Task AddAsync(
        Domain.Drops.Drop drop,
        CancellationToken cancellationToken = default);

    Task<Domain.Drops.Drop?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}
