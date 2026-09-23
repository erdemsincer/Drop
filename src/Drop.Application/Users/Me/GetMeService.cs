using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Users.Me;

public sealed class GetMeService
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUser _currentUser;

    public GetMeService(
        IUserRepository userRepository,
        ICurrentUser currentUser)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<MeResponse> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(_currentUser.Id, cancellationToken)
            ?? throw new AuthenticationException(
                ErrorCodes.Auth.InvalidCredentials,
                "User no longer exists.");

        return new MeResponse(user.Id, user.Email, user.FirstName, user.LastName);
    }
}
