namespace Drop.Api.Configuration;

/// <summary>
/// Fails fast on unsafe production configuration instead of starting with
/// development secrets or keys too short to be secure.
/// </summary>
internal static class StartupValidation
{
    private const int MinimumKeyLength = 32;

    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        var errors = new List<string>();

        CheckSecret(configuration["Jwt:Key"], "Jwt:Key", environment, errors);
        CheckSecret(configuration["Qr:SigningKey"], "Qr:SigningKey", environment, errors);

        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Database")))
        {
            errors.Add("ConnectionStrings:Database is not configured.");
        }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                "Invalid configuration:" + Environment.NewLine + string.Join(Environment.NewLine, errors));
        }
    }

    private static void CheckSecret(string? value, string name, IHostEnvironment environment, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length < MinimumKeyLength)
        {
            errors.Add($"{name} must be set and at least {MinimumKeyLength} characters long.");
            return;
        }

        if (!environment.IsDevelopment() && value.Contains("development", StringComparison.OrdinalIgnoreCase))
        {
            errors.Add($"{name} still holds the development value; set a real secret (e.g. via environment variable).");
        }
    }
}
