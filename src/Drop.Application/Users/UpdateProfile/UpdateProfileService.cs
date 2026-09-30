using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Users.Me;

namespace Drop.Application.Users.UpdateProfile;

public sealed class UpdateProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly GetMeService _getMeService;

    public UpdateProfileService(
        IUserRepository userRepository,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork,
        GetMeService getMeService)
    {
        _userRepository = userRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _getMeService = getMeService;
    }

    public async Task<MeResponse> ExecuteAsync(
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(_currentUser.Id, cancellationToken)
            ?? throw new AuthenticationException(ErrorCodes.Auth.InvalidCredentials, "User no longer exists.");

        user.Rename(request.FirstName, request.LastName);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _getMeService.ExecuteAsync(cancellationToken);
    }
}
