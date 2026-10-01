using Drop.Application.Abstractions;
using Drop.Application.Authentication.Login;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Users;
using Drop.Domain.Users;

namespace Drop.Application.Authentication.External;

/// <summary>
/// "Continue with Apple/Google": signs in the linked user, links an existing
/// account with the same verified e-mail, or creates a new one.
/// </summary>
public sealed class ExternalSignInService
{
    // Used when the provider shares no name (Apple after the first sign-in); editable in the profile.
    private const string FallbackFirstName = "Drop";
    private const string FallbackLastName = "Kullanıcısı";

    private readonly IExternalIdentityVerifier _verifier;
    private readonly IExternalLoginStore _logins;
    private readonly IUserRepository _userRepository;
    private readonly ITokenProvider _tokenProvider;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public ExternalSignInService(
        IExternalIdentityVerifier verifier,
        IExternalLoginStore logins,
        IUserRepository userRepository,
        ITokenProvider tokenProvider,
        IRefreshTokenService refreshTokenService,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _verifier = verifier;
        _logins = logins;
        _userRepository = userRepository;
        _tokenProvider = tokenProvider;
        _refreshTokenService = refreshTokenService;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    public async Task<LoginResponse> ExecuteAsync(
        ExternalProvider provider,
        ExternalSignInRequest request,
        CancellationToken cancellationToken = default)
    {
        var identity = await _verifier.VerifyAsync(provider, request.IdToken, cancellationToken)
            ?? throw new AuthenticationException(
                ErrorCodes.Auth.InvalidExternalToken,
                "The sign-in token could not be verified.");

        var now = _timeProvider.GetUtcNow();
        var user = await FindOrCreateUserAsync(provider, identity, request, now, cancellationToken);

        if (user.Status != UserStatus.Active)
        {
            throw new AuthenticationException(
                ErrorCodes.Auth.UserInactive,
                "User is not active.");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var refreshToken = await _refreshTokenService.IssueAsync(user.Id, cancellationToken);

        return new LoginResponse(
            _tokenProvider.Create(user),
            _tokenProvider.AccessTokenLifetimeSeconds,
            refreshToken);
    }

    private async Task<User> FindOrCreateUserAsync(
        ExternalProvider provider,
        ExternalIdentity identity,
        ExternalSignInRequest request,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var login = await _logins.FindAsync(provider, identity.Subject, cancellationToken);

        if (login is not null)
        {
            return await _userRepository.GetByIdAsync(login.UserId, cancellationToken)
                ?? throw new AuthenticationException(
                    ErrorCodes.Auth.InvalidCredentials,
                    "User no longer exists.");
        }

        // Linking by e-mail is only safe when the provider has proved the address.
        if (string.IsNullOrWhiteSpace(identity.Email) || !identity.EmailVerified)
        {
            throw new AuthenticationException(
                ErrorCodes.Auth.ExternalEmailMissing,
                "The provider did not share a verified e-mail address.");
        }

        var user = await _userRepository.GetByEmailAsync(identity.Email.Trim().ToLowerInvariant(), cancellationToken);

        if (user is null)
        {
            user = User.CreateExternal(
                identity.Email,
                Pick(request.FirstName, identity.FirstName, FallbackFirstName),
                Pick(request.LastName, identity.LastName, FallbackLastName),
                now);

            await _userRepository.AddAsync(user, cancellationToken);
        }
        else
        {
            // The provider just proved this address, which settles verification too.
            user.MarkEmailVerified(now);
        }

        _logins.Add(new ExternalLogin(user.Id, provider, identity.Subject, now));

        return user;
    }

    private static string Pick(string? fromApp, string? fromToken, string fallback) =>
        !string.IsNullOrWhiteSpace(fromApp) ? fromApp.Trim()
        : !string.IsNullOrWhiteSpace(fromToken) ? fromToken.Trim()
        : fallback;
}
