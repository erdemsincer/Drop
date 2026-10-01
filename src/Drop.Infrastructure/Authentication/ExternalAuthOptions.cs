namespace Drop.Infrastructure.Authentication;

/// <summary>
/// Which app ids an Apple or Google identity token may be issued to (its "aud").
/// A token minted for any other app is rejected, even though the provider signed it.
/// </summary>
public sealed class ExternalAuthOptions
{
    public const string SectionName = "ExternalAuth";

    /// <summary>iOS bundle ids. Expo Go signs in as "host.exp.Exponent"; allow that only for testing.</summary>
    public string[] AppleClientIds { get; set; } = [];

    /// <summary>OAuth client ids from Google Cloud (the web client id the app requests tokens for).</summary>
    public string[] GoogleClientIds { get; set; } = [];
}
