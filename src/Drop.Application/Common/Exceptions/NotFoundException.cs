namespace Drop.Application.Common.Exceptions;

/// <summary>
/// Thrown when a requested resource is not found.
/// Maps to HTTP 404 Not Found.
/// </summary>
public sealed class NotFoundException : DropException
{
    public NotFoundException(
        string code,
        string message)
        : base(code, message)
    {
    }
}
