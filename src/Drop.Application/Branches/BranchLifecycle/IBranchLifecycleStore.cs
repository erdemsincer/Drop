using Drop.Domain.Branches;

namespace Drop.Application.Branches.BranchLifecycle;

public interface IBranchLifecycleStore
{
    /// <summary>
    /// Saves the closed branch and, in the same transaction, cancels its live
    /// and scheduled drops together with their unused reservations.
    /// </summary>
    Task SaveClosedAsync(
        Branch branch,
        CancellationToken cancellationToken = default);
}
