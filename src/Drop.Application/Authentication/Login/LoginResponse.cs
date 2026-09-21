namespace Drop.Application.Authentication.Login;

public sealed record LoginResponse(string AccessToken, int ExpiresIn);
