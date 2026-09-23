using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Drop.Infrastructure.BackgroundJobs;

internal sealed class ExpirationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeProvider _timeProvider;
    private readonly ExpirationOptions _options;
    private readonly ILogger<ExpirationWorker> _logger;

    public ExpirationWorker(
        IServiceScopeFactory scopeFactory,
        TimeProvider timeProvider,
        IOptions<ExpirationOptions> options,
        ILogger<ExpirationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _timeProvider = timeProvider;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Expiration worker is disabled.");
            return;
        }

        using var timer = new PeriodicTimer(
            TimeSpan.FromSeconds(Math.Max(5, _options.IntervalSeconds)),
            _timeProvider);

        do
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var sweeper = scope.ServiceProvider.GetRequiredService<ExpirationSweeper>();

                var result = await sweeper.RunAsync(_timeProvider.GetUtcNow(), stoppingToken);

                if (result.ExpiredDrops > 0 || result.ExpiredClaims > 0 || result.ActivatedDrops > 0)
                {
                    _logger.LogInformation(
                        "Activated {ActivatedCount} scheduled drops; expired {DropCount} drops and {ClaimCount} claims.",
                        result.ActivatedDrops,
                        result.ExpiredDrops,
                        result.ExpiredClaims);
                }
            }
            catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
            {
                // A failed sweep must not take the API down; the next tick retries.
                _logger.LogError(exception, "Expiration sweep failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
