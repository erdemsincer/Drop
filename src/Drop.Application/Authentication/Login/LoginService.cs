using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Users;
using Drop.Domain.Users;

namespace Drop.Application.Authentication.Login;

public sealed class LoginService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenProvider _tokenProvider;
    private readonly IRefreshTokenService _refreshTokenService;

    public LoginService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenProvider tokenProvider,
        IRefreshTokenService refreshTokenService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenProvider = tokenProvider;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<LoginResponse> ExecuteAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(
            email,
            cancellationToken);

        // Apple/Google-only accounts have no password to match.
        if (user?.PasswordHash is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new AuthenticationException(
                ErrorCodes.Auth.InvalidCredentials,
                "Email or password is incorrect.");
        }

        if (user.Status != UserStatus.Active)
        {
            throw new AuthenticationException(
                ErrorCodes.Auth.UserInactive,
                "User is not active.");
        }

        var refreshToken = await _refreshTokenService.IssueAsync(user.Id, cancellationToken);

        return new LoginResponse(
            _tokenProvider.Create(user),
            _tokenProvider.AccessTokenLifetimeSeconds,
            refreshToken);
    }
}
