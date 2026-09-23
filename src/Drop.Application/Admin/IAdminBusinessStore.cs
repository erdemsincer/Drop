using Drop.Domain.Businesses;

namespace Drop.Application.Admin;

public interface IAdminBusinessStore
{
    Task<IReadOnlyList<AdminBusinessResponse>> ListAsync(
        BusinessStatus? status,
        CancellationToken cancellationToken = default);

    Task<AdminBusinessResponse?> GetAsync(
        Guid businessId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Persists the business' new status; when it is Suspended, also cancels its
    /// live/scheduled drops and their unused reservations, all in one transaction.
    /// </summary>
    Task SaveStatusAsync(
        Business business,
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
