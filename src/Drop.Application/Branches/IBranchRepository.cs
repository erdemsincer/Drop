using Drop.Domain.Branches;

namespace Drop.Application.Branches;

public interface IBranchRepository
{
    Task AddAsync(
        Branch branch,
        CancellationToken cancellationToken = default);

    Task<Branch?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}
