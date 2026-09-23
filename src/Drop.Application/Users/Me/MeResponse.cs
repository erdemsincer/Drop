namespace Drop.Application.Users.Me;

public sealed record MeResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName);
