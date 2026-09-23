using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Users.DeleteAccount;

public sealed class DeleteAccountService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAccountDeletionStore _deletionStore;
    private readonly ICurrentUser _currentUser;

    public DeleteAccountService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAccountDeletionStore deletionStore,
        ICurrentUser currentUser)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _deletionStore = deletionStore;
        _currentUser = currentUser;
    }

    public async Task ExecuteAsync(
        DeleteAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(_currentUser.Id, cancellationToken);

        // Re-confirm with the password: a stolen, unlocked phone must not be enough.
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new AuthenticationException(
                ErrorCodes.Auth.InvalidCredentials,
                "Password is incorrect.");
        }

        await _deletionStore.DeleteAsync(user.Id, cancellationToken);
    }
}
