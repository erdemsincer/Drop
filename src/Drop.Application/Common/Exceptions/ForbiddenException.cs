namespace Drop.Application.Common.Exceptions;

/// <summary>
/// Thrown when a user lacks authorization to perform an action.
/// Maps to HTTP 403 Forbidden.
/// </summary>
public sealed class ForbiddenException : DropException
{
    public ForbiddenException(
        string code,
        string message)
        : base(code, message)
    {
    }
}
