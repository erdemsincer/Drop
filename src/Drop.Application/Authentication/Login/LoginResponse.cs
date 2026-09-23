namespace Drop.Application.Authentication.Login;

/// <param name="ExpiresIn">Access token lifetime in seconds.</param>
public sealed record LoginResponse(
    string AccessToken,
    int ExpiresIn,
    string RefreshToken);
