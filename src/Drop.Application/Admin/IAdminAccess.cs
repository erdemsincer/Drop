namespace Drop.Application.Admin;

/// <summary>Platform operators who review businesses. Pilot: configured by e-mail.</summary>
public interface IAdminAccess
{
    Task<bool> IsAdminAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
