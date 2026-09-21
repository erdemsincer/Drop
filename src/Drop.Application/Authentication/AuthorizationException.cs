namespace Drop.Application.Authentication;

public sealed class AuthorizationException : Exception
{
    public AuthorizationException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    public string Code { get; }
}
