using System.Security.Cryptography;
using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Notifications;
using Drop.Domain.Users;

namespace Drop.Application.Users.EmailVerification;

public sealed class EmailVerificationService
{
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromHours(24);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

    private readonly IUserRepository _userRepository;
    private readonly IVerificationCodeStore _codeStore;
    private readonly IEmailSender _emailSender;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public EmailVerificationService(
        IUserRepository userRepository,
        IVerificationCodeStore codeStore,
        IEmailSender emailSender,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _userRepository = userRepository;
        _codeStore = codeStore;
        _emailSender = emailSender;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// E-mails a fresh code unless the address is already verified or one was
    /// sent in the last minute (then it silently does nothing).
    /// </summary>
    public async Task SendCodeAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        if (user.IsEmailVerified)
        {
            return;
        }

        var now = _timeProvider.GetUtcNow();
        var latest = await _codeStore.GetLatestAsync(user.Id, VerificationPurpose.EmailVerification, cancellationToken);

        if (latest is not null && now - latest.CreatedAt < ResendCooldown)
        {
            return;
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        await _codeStore.ReplaceAsync(
            new VerificationCode(
                user.Id,
                VerificationPurpose.EmailVerification,
                _codeStore.Hash(user.Id, VerificationPurpose.EmailVerification, code),
                now,
                CodeLifetime),
            now,
            cancellationToken);

        await _emailSender.SendAsync(
            user.Email,
            "Drop e-posta doğrulama kodun",
            $"""
            Merhaba {user.FirstName},

            Drop'a hoş geldin! E-postanı doğrulamak için kodun: {code}

            Kod 24 saat geçerli. Bu hesabı sen açmadıysan bu e-postayı yok sayabilirsin.
            """,
            cancellationToken);
    }

    public async Task ResendAsync(CancellationToken cancellationToken = default)
    {
        await SendCodeAsync(await GetCurrentUserAsync(cancellationToken), cancellationToken);
    }

    public async Task VerifyAsync(
        VerifyEmailRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);

        if (user.IsEmailVerified)
        {
            return;
        }

        var now = _timeProvider.GetUtcNow();
        var stored = await _codeStore.GetLatestAsync(user.Id, VerificationPurpose.EmailVerification, cancellationToken);

        if (stored is null || !stored.IsUsable(now))
        {
            throw InvalidCode();
        }

        if (!_codeStore.Matches(stored, request.Code))
        {
            stored.RegisterFailedAttempt();
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw InvalidCode();
        }

        user.MarkEmailVerified(now);
        stored.MarkUsed(now);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> GetCurrentUserAsync(CancellationToken cancellationToken) =>
        await _userRepository.GetByIdAsync(_currentUser.Id, cancellationToken)
        ?? throw new AuthenticationException(ErrorCodes.Auth.InvalidCredentials, "User no longer exists.");

    private static ConflictException InvalidCode() =>
        new(ErrorCodes.Auth.InvalidVerificationCode, "The verification code is invalid or has expired.");
}
