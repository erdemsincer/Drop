using Drop.Application.Authentication.External;
using Drop.Domain.Users;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Users;

internal sealed class ExternalLoginStore : IExternalLoginStore
{
    private readonly DropDbContext _dbContext;

    public ExternalLoginStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<ExternalLogin?> FindAsync(
        ExternalProvider provider,
        string subject,
        CancellationToken cancellationToken = default) =>
        _dbContext.ExternalLogins.FirstOrDefaultAsync(
            x => x.Provider == provider && x.Subject == subject,
            cancellationToken);

    public void Add(ExternalLogin login) => _dbContext.ExternalLogins.Add(login);
}
