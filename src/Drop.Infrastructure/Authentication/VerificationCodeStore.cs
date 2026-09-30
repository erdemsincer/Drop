using System.Security.Cryptography;
using System.Text;
using Drop.Application.Authentication;
using Drop.Domain.Users;
using Drop.Infrastructure.Persistence;
using Drop.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Drop.Infrastructure.Authentication;

internal sealed class VerificationCodeStore : IVerificationCodeStore
{
    private readonly DropDbContext _dbContext;

    public VerificationCodeStore(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<VerificationCode?> GetLatestAsync(
        Guid userId,
        VerificationPurpose purpose,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.VerificationCodes
            .Where(x => x.UserId == userId && x.Purpose == purpose)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task ReplaceAsync(
        VerificationCode code,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        await _dbContext.VerificationCodes
            .Where(x => x.UserId == code.UserId && x.Purpose == code.Purpose && x.UsedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.UsedAt, now), cancellationToken);

        _dbContext.VerificationCodes.Add(code);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public string Hash(Guid userId, VerificationPurpose purpose, string code) =>
        SecureToken.Hash($"{purpose}:{userId:N}:{code}");

    public bool Matches(VerificationCode stored, string code) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(stored.CodeHash),
            Encoding.ASCII.GetBytes(Hash(stored.UserId, stored.Purpose, code.Trim())));
}
