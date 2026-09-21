using Drop.Application.Abstractions;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Users;
using Drop.Domain.Users;

namespace Drop.Application.Authentication.Register;

public sealed class RegisterService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public RegisterService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    public async Task<RegisterResponse> ExecuteAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _userRepository.GetByEmailAsync(
            email,
            cancellationToken);

        if (existingUser is not null)
        {
            throw new ConflictException(
                ErrorCodes.Auth.EmailExists,
                "Email is already registered.");
        }

        var passwordHash = _passwordHasher.Hash(request.Password);

        var user = new User(
            email,
            passwordHash,
            request.FirstName,
            request.LastName,
            _timeProvider.GetUtcNow());

        await _userRepository.AddAsync(user, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new RegisterResponse(user.Id, user.Email);
    }
}
