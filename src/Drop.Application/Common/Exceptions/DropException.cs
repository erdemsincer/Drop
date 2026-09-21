namespace Drop.Application.Common.Exceptions;

/// <summary>
/// Base exception for all application-level errors.
/// Derived exceptions map to specific HTTP status codes and error codes.
/// </summary>
public abstract class DropException : Exception
{
    protected DropException(
        string code,
        string message)
        : base(message)
    {
        Code = code;
    }

    /// <summary>
    /// Machine-readable error code for client-side localization and handling.
    /// Example: "auth.invalid_credentials", "drop.not_found", "claim.already_exists"
    /// </summary>
    public string Code { get; }
}
