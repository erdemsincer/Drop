namespace Drop.Application.Common.Exceptions;

/// <summary>
/// Thrown when a request conflicts with the current state of a resource.
/// Examples: duplicate claims, sold-out drops, invalid QR tokens.
/// Maps to HTTP 409 Conflict.
/// </summary>
public sealed class ConflictException : DropException
{
    public ConflictException(
        string code,
        string message)
        : base(code, message)
    {
    }
}
