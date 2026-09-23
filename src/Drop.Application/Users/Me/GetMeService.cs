using Drop.Application.Admin;
using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Users.Me;

public sealed class GetMeService
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUser _currentUser;
    private readonly IAdminAccess _adminAccess;

    public GetMeService(
        IUserRepository userRepository,
        ICurrentUser currentUser,
        IAdminAccess adminAccess)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
        _adminAccess = adminAccess;
    }

    public async Task<MeResponse> ExecuteAsync(
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(_currentUser.Id, cancellationToken)
            ?? throw new AuthenticationException(
                ErrorCodes.Auth.InvalidCredentials,
                "User no longer exists.");

        var isAdmin = await _adminAccess.IsAdminAsync(user.Id, cancellationToken);

        return new MeResponse(user.Id, user.Email, user.FirstName, user.LastName, isAdmin);
    }
}
