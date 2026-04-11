using IoTAttendance.API.Data;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

/// <summary>
/// Background service that closes stale hotspot sessions.
/// A session is considered stale if no RADIUS Accounting packet
/// (Start/Interim-Update/Stop) has been received for more than
/// <see cref="StaleThresholdMinutes"/> minutes.
/// </summary>
public class SessionCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SessionCleanupService> _logger;

    private const int CheckIntervalMinutes = 2;
    private const int StaleThresholdMinutes = 10;

    public SessionCleanupService(IServiceScopeFactory scopeFactory, ILogger<SessionCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SessionCleanupService started. Checking every {interval} min, stale threshold {threshold} min.",
            CheckIntervalMinutes, StaleThresholdMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(CheckIntervalMinutes), stoppingToken);

            try
            {
                await CleanupStaleSessionsAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "SessionCleanupService: error while closing stale sessions.");
            }
        }
    }

    private async Task CleanupStaleSessionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var threshold = DateTime.UtcNow.AddMinutes(-StaleThresholdMinutes);

        // COALESCE: if LastAccountingAt is null, fall back to StartTime
        var staleSessions = await db.HotspotSessions
            .Where(s => s.IsActive && s.EndTime == null &&
                        (s.LastAccountingAt == null ? s.StartTime : s.LastAccountingAt) < threshold)
            .ToListAsync(ct);

        if (staleSessions.Count == 0) return;

        var now = DateTime.UtcNow;
        foreach (var session in staleSessions)
        {
            session.IsActive = false;
            session.EndTime = now;
            session.DisconnectReason = "Timeout – no accounting update";
            session.DurationMinutes = (now - session.StartTime).TotalMinutes;
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("SessionCleanupService: closed {count} stale session(s).", staleSessions.Count);
    }
}
