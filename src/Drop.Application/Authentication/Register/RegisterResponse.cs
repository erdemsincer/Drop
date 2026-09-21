namespace Drop.Application.Authentication.Register;

public sealed record RegisterResponse(
    Guid UserId,
    string Email);
