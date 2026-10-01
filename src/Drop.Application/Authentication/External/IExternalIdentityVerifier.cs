using Drop.Domain.Users;

namespace Drop.Application.Authentication.External;

/// <summary>What Apple or Google vouch for in a verified identity token.</summary>
public sealed record ExternalIdentity(
    string Subject,
    string? Email,
    bool EmailVerified,
    string? FirstName,
    string? LastName);

public interface IExternalIdentityVerifier
{
    /// <summary>
    /// Checks the token's signature, issuer, audience and lifetime against the
    /// provider's published keys. Null when the token is not one we accept.
    /// </summary>
    Task<ExternalIdentity?> VerifyAsync(
        ExternalProvider provider,
        string idToken,
        CancellationToken cancellationToken = default);
}
