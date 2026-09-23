using Drop.Application.Authentication.Refresh;

namespace Drop.Application.Authentication.Logout;

public sealed class LogoutService
{
    private readonly IRefreshTokenService _refreshTokenService;

    public LogoutService(IRefreshTokenService refreshTokenService)
    {
        _refreshTokenService = refreshTokenService;
    }

    /// <summary>Revokes the refresh token. Unknown tokens are ignored so logout is idempotent.</summary>
    public Task ExecuteAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        return _refreshTokenService.RevokeAsync(request.RefreshToken, cancellationToken);
    }
}
