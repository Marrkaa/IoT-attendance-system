using System.Globalization;

namespace IoTAttendance.API.Services;

public interface IAppTimeProvider
{
    DateTime UtcNow { get; }
    DateOnly UtcToday { get; }
    DateTime LocalNow { get; }
    DateOnly LocalToday { get; }
    TimeZoneInfo AppTimeZone { get; }
    DateTime ToUtc(DateOnly localDate, TimeOnly localTime);
    DateTime ToLocal(DateTime utcDateTime);
    bool IsFakeTimeEnabled { get; }
}

public class AppTimeProvider : IAppTimeProvider
{
    private readonly DateTimeOffset? _fakeBaseUtc;
    private readonly DateTimeOffset? _realBaseUtc;
    private readonly TimeZoneInfo _appTimeZone;

    public AppTimeProvider(IConfiguration configuration, IWebHostEnvironment environment, ILogger<AppTimeProvider> logger)
    {
        var tzName = configuration["APP_TIME_ZONE"];
        if (string.IsNullOrWhiteSpace(tzName))
            tzName = "Europe/Vilnius";

        try
        {
            _appTimeZone = TimeZoneInfo.FindSystemTimeZoneById(tzName);
        }
        catch
        {
            _appTimeZone = TimeZoneInfo.Utc;
            logger.LogWarning("Invalid APP_TIME_ZONE '{TimeZone}'. Falling back to UTC.", tzName);
        }

        var raw = configuration["FAKE_NOW"];
        if (string.IsNullOrWhiteSpace(raw))
            return;

        if (!environment.IsDevelopment())
        {
            logger.LogWarning("FAKE_NOW is ignored outside Development environment.");
            return;
        }

        if (!DateTimeOffset.TryParse(
                raw,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var parsed))
        {
            logger.LogWarning("Invalid FAKE_NOW value '{FakeNow}'. Expected ISO date-time (for example 2026-04-14T10:20:00Z).", raw);
            return;
        }

        _fakeBaseUtc = parsed;
        _realBaseUtc = DateTimeOffset.UtcNow;
        logger.LogWarning(
            "FAKE_NOW is enabled: API clock starts at {FakeNowUtc:O} and continues ticking in real time.",
            _fakeBaseUtc.Value.UtcDateTime);
    }

    public DateTime UtcNow
    {
        get
        {
            if (_fakeBaseUtc.HasValue && _realBaseUtc.HasValue)
            {
                var elapsed = DateTimeOffset.UtcNow - _realBaseUtc.Value;
                return _fakeBaseUtc.Value.Add(elapsed).UtcDateTime;
            }
            return DateTimeOffset.UtcNow.UtcDateTime;
        }
    }

    public DateOnly UtcToday => DateOnly.FromDateTime(UtcNow);

    public DateTime LocalNow => ToLocal(UtcNow);

    public DateOnly LocalToday => DateOnly.FromDateTime(LocalNow);

    public TimeZoneInfo AppTimeZone => _appTimeZone;

    public DateTime ToUtc(DateOnly localDate, TimeOnly localTime)
    {
        var local = DateTime.SpecifyKind(localDate.ToDateTime(localTime), DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(local, _appTimeZone);
    }

    public DateTime ToLocal(DateTime utcDateTime)
    {
        var utc = utcDateTime.Kind == DateTimeKind.Utc
            ? utcDateTime
            : DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utc, _appTimeZone);
    }

    public bool IsFakeTimeEnabled => _fakeBaseUtc.HasValue;
}
