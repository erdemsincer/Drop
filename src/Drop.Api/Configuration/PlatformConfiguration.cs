using System.Globalization;

namespace Drop.Api.Configuration;

/// <summary>
/// Adapts to hosting platforms (Railway, Render, Fly, Heroku-style) that hand
/// out a <c>DATABASE_URL</c> and a <c>PORT</c> instead of .NET-style settings.
/// Explicit .NET settings always win.
/// </summary>
internal static class PlatformConfiguration
{
    public static void Apply(WebApplicationBuilder builder)
    {
        var configuration = builder.Configuration;

        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Database")) &&
            configuration["DATABASE_URL"] is { Length: > 0 } databaseUrl)
        {
            configuration["ConnectionStrings:Database"] = ToNpgsqlConnectionString(databaseUrl);
        }

        if (configuration["PORT"] is { Length: > 0 } port &&
            int.TryParse(port, NumberStyles.None, CultureInfo.InvariantCulture, out var portNumber))
        {
            builder.WebHost.UseUrls($"http://0.0.0.0:{portNumber}");
        }
    }

    /// <summary>postgres://user:pass@host:5432/db → Npgsql key/value form.</summary>
    public static string ToNpgsqlConnectionString(string databaseUrl)
    {
        var uri = new Uri(databaseUrl);
        var credentials = uri.UserInfo.Split(':', 2);

        var parts = new List<string>
        {
            $"Host={uri.Host}",
            $"Port={(uri.Port > 0 ? uri.Port : 5432)}",
            $"Database={Quote(Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')))}",
            $"Username={Quote(Uri.UnescapeDataString(credentials[0]))}",
        };

        if (credentials.Length > 1)
        {
            parts.Add($"Password={Quote(Uri.UnescapeDataString(credentials[1]))}");
        }

        // Use TLS when the server offers it (public proxies), plain on private networks.
        parts.Add("SSL Mode=Prefer");

        return string.Join(';', parts);
    }

    // Generated passwords may contain ';' or quotes, which would split the string.
    private static string Quote(string value) =>
        value.IndexOfAny([';', '"', '\'', ' ']) >= 0 ? $"\"{value.Replace("\"", "\"\"")}\"" : value;
}
