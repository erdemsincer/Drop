using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Authentication.Login;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Users.ChangePassword;

public sealed class ChangePasswordService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly ITokenProvider _tokenProvider;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ChangePasswordService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IRefreshTokenService refreshTokenService,
        ITokenProvider tokenProvider,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _refreshTokenService = refreshTokenService;
        _tokenProvider = tokenProvider;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Changes the password and signs out every other device. The caller gets
    /// a fresh token pair so this device stays signed in.
    /// </summary>
    public async Task<LoginResponse> ExecuteAsync(
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(_currentUser.Id, cancellationToken);

        // 409 rather than 401: a wrong password here is a form error, not a dead session.
        if (user is null || !_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new ConflictException(
                ErrorCodes.Auth.InvalidCredentials,
                "Current password is incorrect.");
        }

        user.ChangePassword(_passwordHasher.Hash(request.NewPassword));
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _refreshTokenService.RevokeAllAsync(user.Id, cancellationToken);
        var refreshToken = await _refreshTokenService.IssueAsync(user.Id, cancellationToken);

        return new LoginResponse(
            _tokenProvider.Create(user),
            _tokenProvider.AccessTokenLifetimeSeconds,
            refreshToken);
    }
}
