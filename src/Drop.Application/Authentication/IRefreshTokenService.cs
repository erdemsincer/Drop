namespace Drop.Application.Authentication;

public interface IRefreshTokenService
{
    /// <summary>Creates and persists a refresh token; returns the raw value (shown once).</summary>
    Task<string> IssueAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes the presented token and issues its replacement.
    /// Presenting an already-revoked token is treated as theft: all of the
    /// user's sessions are revoked and the call fails.
    /// </summary>
    Task<RefreshRotation> RotateAsync(
        string rawToken,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        string rawToken,
        CancellationToken cancellationToken = default);

    /// <summary>Signs the user out everywhere (e.g. after a password reset).</summary>
    Task RevokeAllAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}

public sealed record RefreshRotation(Guid UserId, string RefreshToken);
