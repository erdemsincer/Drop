using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Users;
using Drop.Infrastructure.Persistence;
using Drop.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Drop.Infrastructure.Authentication;

internal sealed class RefreshTokenService : IRefreshTokenService
{
    private readonly DropDbContext _dbContext;
    private readonly TimeProvider _timeProvider;
    private readonly TimeSpan _lifetime;

    public RefreshTokenService(
        DropDbContext dbContext,
        TimeProvider timeProvider,
        IOptions<JwtOptions> options)
    {
        _dbContext = dbContext;
        _timeProvider = timeProvider;
        _lifetime = TimeSpan.FromDays(options.Value.RefreshTokenDays);
    }

    public async Task<string> IssueAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var (raw, token) = Create(userId, _timeProvider.GetUtcNow());

        _dbContext.RefreshTokens.Add(token);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return raw;
    }

    public async Task<RefreshRotation> RotateAsync(
        string rawToken,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var hash = SecureToken.Hash(rawToken);

        var current = await _dbContext.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TokenHash == hash, cancellationToken)
            ?? throw Invalid();

        if (current.RevokedAt is not null)
        {
            // A revoked token came back: it was stolen or replayed. Kill the family.
            await RevokeAllAsync(current.UserId, now, cancellationToken);
            throw Invalid();
        }

        if (current.ExpiresAt <= now)
        {
            throw Invalid();
        }

        await using var transaction =
            await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var (raw, replacement) = Create(current.UserId, now);

        _dbContext.RefreshTokens.Add(replacement);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Conditional revoke: of two concurrent rotations only one can win.
        var revoked = await _dbContext.RefreshTokens
            .Where(x => x.Id == current.Id && x.RevokedAt == null)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.RevokedAt, now)
                    .SetProperty(x => x.ReplacedByTokenId, replacement.Id),
                cancellationToken);

        if (revoked == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            _dbContext.ChangeTracker.Clear();

            await RevokeAllAsync(current.UserId, now, cancellationToken);
            throw Invalid();
        }

        await transaction.CommitAsync(cancellationToken);

        return new RefreshRotation(current.UserId, raw);
    }

    public async Task RevokeAsync(
        string rawToken,
        CancellationToken cancellationToken = default)
    {
        var hash = SecureToken.Hash(rawToken);
        var now = _timeProvider.GetUtcNow();

        await _dbContext.RefreshTokens
            .Where(x => x.TokenHash == hash && x.RevokedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.RevokedAt, now), cancellationToken);
    }

    private Task RevokeAllAsync(Guid userId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        return _dbContext.RefreshTokens
            .Where(x => x.UserId == userId && x.RevokedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.RevokedAt, now), cancellationToken);
    }

    private (string Raw, RefreshToken Token) Create(Guid userId, DateTimeOffset now)
    {
        var raw = SecureToken.Generate();
        return (raw, new RefreshToken(userId, SecureToken.Hash(raw), now, _lifetime));
    }

    private static AuthenticationException Invalid() =>
        new(ErrorCodes.Auth.InvalidRefreshToken, "Refresh token is invalid or expired.");
}
