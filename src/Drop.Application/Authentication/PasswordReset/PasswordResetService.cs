using System.Security.Cryptography;
using Drop.Application.Abstractions;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Notifications;
using Drop.Application.Users;
using Drop.Domain.Users;

namespace Drop.Application.Authentication.PasswordReset;

public sealed class PasswordResetService
{
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

    private readonly IUserRepository _userRepository;
    private readonly IVerificationCodeStore _codeStore;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IEmailSender _emailSender;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public PasswordResetService(
        IUserRepository userRepository,
        IVerificationCodeStore codeStore,
        IPasswordHasher passwordHasher,
        IRefreshTokenService refreshTokenService,
        IEmailSender emailSender,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _userRepository = userRepository;
        _codeStore = codeStore;
        _passwordHasher = passwordHasher;
        _refreshTokenService = refreshTokenService;
        _emailSender = emailSender;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Always completes silently, whether or not the e-mail has an account,
    /// so the endpoint can't be used to discover who is registered.
    /// </summary>
    public async Task RequestAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(Normalize(request.Email), cancellationToken);

        if (user is null || user.Status != UserStatus.Active)
        {
            return;
        }

        var now = _timeProvider.GetUtcNow();
        var latest = await _codeStore.GetLatestAsync(user.Id, VerificationPurpose.PasswordReset, cancellationToken);

        if (latest is not null && now - latest.CreatedAt < ResendCooldown)
        {
            return;
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        await _codeStore.ReplaceAsync(
            new VerificationCode(
                user.Id,
                VerificationPurpose.PasswordReset,
                _codeStore.Hash(user.Id, VerificationPurpose.PasswordReset, code),
                now,
                CodeLifetime),
            now,
            cancellationToken);

        await _emailSender.SendAsync(
            user.Email,
            "Drop şifre sıfırlama kodun",
            $"""
            Merhaba {user.FirstName},

            Drop şifreni sıfırlamak için kodun: {code}

            Kod 15 dakika geçerli. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.
            """,
            cancellationToken);
    }

    public async Task ResetAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var user = await _userRepository.GetByEmailAsync(Normalize(request.Email), cancellationToken);
        var stored = user is null
            ? null
            : await _codeStore.GetLatestAsync(user.Id, VerificationPurpose.PasswordReset, cancellationToken);

        if (user is null || stored is null || !stored.IsUsable(now))
        {
            throw InvalidCode();
        }

        if (!_codeStore.Matches(stored, request.Code))
        {
            stored.RegisterFailedAttempt();
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw InvalidCode();
        }

        user.ChangePassword(_passwordHasher.Hash(request.NewPassword));
        // The code arrived by e-mail, so it also proves the user owns the inbox.
        user.MarkEmailVerified(now);
        stored.MarkUsed(now);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Whoever knew the old password must not keep a session.
        await _refreshTokenService.RevokeAllAsync(user.Id, cancellationToken);
    }

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();

    private static AuthenticationException InvalidCode() =>
        new(ErrorCodes.Auth.InvalidResetCode, "The reset code is invalid or has expired.");
}
