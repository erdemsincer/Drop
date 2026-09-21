namespace Drop.Application.Claims;

public sealed class ClaimException : Exception
{
    public ClaimException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    public string Code { get; }
}
