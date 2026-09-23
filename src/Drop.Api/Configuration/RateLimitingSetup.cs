using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Drop.Api.Configuration;

internal static class RateLimitingSetup
{
    /// <summary>Login, register, refresh and password reset: per client IP.</summary>
    public const string AuthPolicy = "auth";

    /// <summary>QR redeem: per signed-in user.</summary>
    public const string RedeemPolicy = "redeem";

    public static IServiceCollection AddDropRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var section = configuration.GetSection("RateLimiting");
        var enabled = !bool.TryParse(section["Enabled"], out var value) || value;
        var authPerMinute = int.TryParse(section["AuthPerMinute"], out var auth) ? auth : 10;
        var redeemPerMinute = int.TryParse(section["RedeemPerMinute"], out var redeem) ? redeem : 20;

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRejectionAsync;

            options.AddPolicy(AuthPolicy, context =>
                enabled
                    ? RateLimitPartition.GetFixedWindowLimiter(
                        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => Window(authPerMinute))
                    : RateLimitPartition.GetNoLimiter("disabled"));

            options.AddPolicy(RedeemPolicy, context =>
                enabled
                    ? RateLimitPartition.GetFixedWindowLimiter(
                        context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? context.Connection.RemoteIpAddress?.ToString()
                            ?? "unknown",
                        _ => Window(redeemPerMinute))
                    : RateLimitPartition.GetNoLimiter("disabled"));
        });

        return services;
    }

    private static FixedWindowRateLimiterOptions Window(int permitsPerMinute) => new()
    {
        PermitLimit = permitsPerMinute,
        Window = TimeSpan.FromMinutes(1),
        QueueLimit = 0,
    };

    private static async ValueTask WriteRejectionAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var wait)
            ? (int)Math.Ceiling(wait.TotalSeconds)
            : 60;

        context.HttpContext.Response.Headers.RetryAfter = retryAfter.ToString(CultureInfo.InvariantCulture);

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too many requests.",
            Detail = $"Too many attempts. Try again in {retryAfter} seconds.",
            Type = "https://api.drop.app/errors/rate_limit-exceeded",
            Extensions =
            {
                ["code"] = "rate_limit.exceeded",
                ["retryAfterSeconds"] = retryAfter,
            },
        };

        await context.HttpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
    }
}
