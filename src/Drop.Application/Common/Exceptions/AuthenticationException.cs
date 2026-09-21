namespace Drop.Application.Common.Exceptions;

/// <summary>
/// Thrown when authentication fails (e.g., invalid credentials, inactive user).
/// Maps to HTTP 401 Unauthorized.
/// </summary>
public sealed class AuthenticationException : DropException
{
    public AuthenticationException(
        string code,
        string message)
        : base(code, message)
    {
    }
}
