using Drop.Domain.Businesses;

namespace Drop.Application.Businesses;

public interface IBusinessRepository
{
    Task AddAsync(
        Business business,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAsync(
        string name,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

