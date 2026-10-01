using Drop.Domain.Users;

namespace Drop.Application.Authentication.External;

public interface IExternalLoginStore
{
    Task<ExternalLogin?> FindAsync(
        ExternalProvider provider,
        string subject,
        CancellationToken cancellationToken = default);

    void Add(ExternalLogin login);
}
