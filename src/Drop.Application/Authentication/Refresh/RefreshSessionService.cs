using Drop.Application.Authentication.Login;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Users;
using Drop.Domain.Users;

namespace Drop.Application.Authentication.Refresh;

/// <summary>Exchanges a refresh token for a new access + refresh token pair.</summary>
public sealed class RefreshSessionService
{
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IUserRepository _userRepository;
    private readonly ITokenProvider _tokenProvider;

    public RefreshSessionService(
        IRefreshTokenService refreshTokenService,
        IUserRepository userRepository,
        ITokenProvider tokenProvider)
    {
        _refreshTokenService = refreshTokenService;
        _userRepository = userRepository;
        _tokenProvider = tokenProvider;
    }

    public async Task<LoginResponse> ExecuteAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        var rotation = await _refreshTokenService.RotateAsync(request.RefreshToken, cancellationToken);

        var user = await _userRepository.GetByIdAsync(rotation.UserId, cancellationToken);

        if (user is null || user.Status != UserStatus.Active)
        {
            await _refreshTokenService.RevokeAsync(rotation.RefreshToken, cancellationToken);

            throw new AuthenticationException(
                ErrorCodes.Auth.InvalidRefreshToken,
                "Session is no longer valid.");
        }

        return new LoginResponse(
            _tokenProvider.Create(user),
            _tokenProvider.AccessTokenLifetimeSeconds,
            rotation.RefreshToken);
    }
}
