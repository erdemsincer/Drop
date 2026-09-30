using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Drop.Infrastructure.Persistence.Health;

/// <summary>
/// The spatial migration skips itself when PostGIS is missing, which would leave the
/// API running with a broken nearby feed. Failing readiness makes that impossible to miss.
/// </summary>
internal sealed class PostGisHealthCheck : IHealthCheck
{
    private readonly DropDbContext _dbContext;

    public PostGisHealthCheck(DropDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var installed = await _dbContext.Database
            .SqlQueryRaw<bool>("""SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS "Value" """)
            .SingleAsync(cancellationToken);

        return installed
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("PostGIS extension is not installed; use a PostGIS-enabled PostgreSQL.");
    }
}
