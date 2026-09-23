using System.Security.Cryptography;
using System.Text;
using Drop.Application.Authentication.PasswordReset;
using Drop.Domain.Users;
using Drop.Infrastructure.Persistence;
using Drop.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Authentication;

internal sealed class PasswordResetStore : IPasswordResetStore
{
    private readonly DropDbContext _dbContext;

    public PasswordResetStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<PasswordResetCode?> GetLatestAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.PasswordResetCodes
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task ReplaceAsync(
        PasswordResetCode code,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.PasswordResetCodes
            .Where(x => x.UserId == code.UserId && x.UsedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.UsedAt, now), cancellationToken);

        _dbContext.PasswordResetCodes.Add(code);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public string Hash(Guid userId, string code) => SecureToken.Hash($"{userId:N}:{code}");

    public bool Matches(PasswordResetCode stored, Guid userId, string code) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(stored.CodeHash),
            Encoding.ASCII.GetBytes(Hash(userId, code.Trim())));
}
