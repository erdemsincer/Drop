namespace Drop.Application.Authentication;

public sealed class AuthenticationException : Exception
{
    public AuthenticationException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    public string Code { get; }
}
