using System.Security.Claims;
using Drop.Application.Authentication.External;
using Drop.Domain.Users;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Drop.Infrastructure.Authentication;

/// <summary>
/// Verifies Apple and Google identity tokens against the keys each provider
/// publishes (fetched from its OpenID discovery document and cached).
/// </summary>
internal sealed class ExternalIdentityVerifier : IExternalIdentityVerifier
{
    private static readonly ConfigurationManager<OpenIdConnectConfiguration> AppleConfiguration =
        Discovery("https://appleid.apple.com/.well-known/openid-configuration");

    private static readonly ConfigurationManager<OpenIdConnectConfiguration> GoogleConfiguration =
        Discovery("https://accounts.google.com/.well-known/openid-configuration");

    private readonly ExternalAuthOptions _options;
    private readonly ILogger<ExternalIdentityVerifier> _logger;
    private readonly JsonWebTokenHandler _handler = new();

    public ExternalIdentityVerifier(
        IOptions<ExternalAuthOptions> options,
        ILogger<ExternalIdentityVerifier> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ExternalIdentity?> VerifyAsync(
        ExternalProvider provider,
        string idToken,
        CancellationToken cancellationToken = default)
    {
        var (configurationManager, issuers, audiences) = provider switch
        {
            ExternalProvider.Apple => (AppleConfiguration, new[] { "https://appleid.apple.com" }, _options.AppleClientIds),
            ExternalProvider.Google => (GoogleConfiguration, new[] { "https://accounts.google.com", "accounts.google.com" }, _options.GoogleClientIds),
            _ => throw new ArgumentOutOfRangeException(nameof(provider)),
        };

        if (audiences.Length == 0)
        {
            _logger.LogWarning("{Provider} sign-in attempted but no client ids are configured", provider);
            return null;
        }

        OpenIdConnectConfiguration discovery;
        try
        {
            discovery = await configurationManager.GetConfigurationAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Could not load {Provider} signing keys", provider);
            throw;
        }

        var result = await _handler.ValidateTokenAsync(idToken, new TokenValidationParameters
        {
            ValidIssuers = issuers,
            ValidAudiences = audiences,
            IssuerSigningKeys = discovery.SigningKeys,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
        });

        if (!result.IsValid)
        {
            // The token itself is never logged.
            _logger.LogInformation("Rejected {Provider} identity token: {Reason}", provider, result.Exception?.GetType().Name);

            // A rotated key shows up as an unknown kid; refresh so the next try sees it.
            if (result.Exception is SecurityTokenSignatureKeyNotFoundException)
                configurationManager.RequestRefresh();

            return null;
        }

        var claims = result.ClaimsIdentity;
        var subject = claims.FindFirst("sub")?.Value ?? claims.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(subject))
            return null;

        return new ExternalIdentity(
            subject,
            claims.FindFirst("email")?.Value ?? claims.FindFirst(ClaimTypes.Email)?.Value,
            // Apple sends "true" as a string, Google as a boolean; both read as "true" here.
            string.Equals(claims.FindFirst("email_verified")?.Value, "true", StringComparison.OrdinalIgnoreCase),
            claims.FindFirst("given_name")?.Value,
            claims.FindFirst("family_name")?.Value);
    }

    private static ConfigurationManager<OpenIdConnectConfiguration> Discovery(string url) =>
        new(url, new OpenIdConnectConfigurationRetriever(), new HttpDocumentRetriever { RequireHttps = true })
        {
            AutomaticRefreshInterval = TimeSpan.FromHours(12),
        };
}
