using Drop.Application.Admin;
using Drop.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Drop.Infrastructure.Admin;

/// <summary>
/// Admins are the users whose e-mail is listed in Admin:Emails, either as an
/// array or as one comma-separated value (Admin__Emails=a@x.com,b@y.com).
/// </summary>
internal sealed class ConfiguredAdminAccess : IAdminAccess
{
    private readonly DropDbContext _dbContext;
    private readonly HashSet<string> _emails;

    public ConfiguredAdminAccess(DropDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;

        var section = configuration.GetSection("Admin:Emails");
        var values = section.GetChildren().Select(child => child.Value).Append(section.Value);

        _emails = values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .SelectMany(value => value!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(email => email.ToLowerInvariant())
            .ToHashSet();
    }

    public async Task<bool> IsAdminAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (_emails.Count == 0)
        {
            return false;
        }

        var email = await _dbContext.Users
            .Where(user => user.Id == userId)
            .Select(user => user.Email)
            .FirstOrDefaultAsync(cancellationToken);

        return email is not null && _emails.Contains(email);
    }
}
