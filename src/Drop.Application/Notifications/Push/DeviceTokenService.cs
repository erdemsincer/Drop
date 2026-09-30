using Drop.Application.Authentication;
using FluentValidation;

namespace Drop.Application.Notifications.Push;

public sealed record RegisterDeviceTokenRequest(string Token, string? Platform);

public sealed class RegisterDeviceTokenRequestValidator : AbstractValidator<RegisterDeviceTokenRequest>
{
    public RegisterDeviceTokenRequestValidator()
    {
        // Only Expo tokens: the server sends through Expo's push service.
        RuleFor(x => x.Token)
            .NotEmpty()
            .WithErrorCode("token.required")
            .MaximumLength(Domain.Notifications.DeviceToken.MaxTokenLength)
            .WithErrorCode("token.too_long")
            .Matches(@"^Expo(nent)?PushToken\[.+\]$")
            .WithErrorCode("token.invalid");
    }
}

public interface IDeviceTokenStore
{
    /// <summary>Stores the token for the user, taking it over from whoever had it before.</summary>
    Task UpsertAsync(Guid userId, string token, string platform, DateTimeOffset now, CancellationToken cancellationToken = default);

    Task RemoveAsync(Guid userId, string token, CancellationToken cancellationToken = default);
}

public sealed class DeviceTokenService
{
    private readonly IDeviceTokenStore _store;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public DeviceTokenService(IDeviceTokenStore store, ICurrentUser currentUser, TimeProvider timeProvider)
    {
        _store = store;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public Task RegisterAsync(RegisterDeviceTokenRequest request, CancellationToken cancellationToken = default) =>
        _store.UpsertAsync(_currentUser.Id, request.Token.Trim(), request.Platform ?? "unknown", _timeProvider.GetUtcNow(), cancellationToken);

    public Task UnregisterAsync(string token, CancellationToken cancellationToken = default) =>
        _store.RemoveAsync(_currentUser.Id, token.Trim(), cancellationToken);
}
