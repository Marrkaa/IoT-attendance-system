using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

/// <summary>
/// Handles data received from Teltonika RUTX11 router station dump.
/// The router runs the iw station dump script periodically and sends results to this service.
/// </summary>
public class RouterPollingService
{
    private readonly AppDbContext _db;
    private readonly StudentDeviceService _deviceService;
    private readonly SignalProcessingService _signalService;
    private readonly IAppTimeProvider _time;

    public RouterPollingService(
        AppDbContext db,
        StudentDeviceService deviceService,
        SignalProcessingService signalService,
        IAppTimeProvider time)
    {
        _db = db;
        _deviceService = deviceService;
        _signalService = signalService;
        _time = time;
    }

    /// <summary>
    /// Process station dump data from a router.
    /// Called periodically by the router's cron script via REST API.
    /// </summary>
    public async Task ProcessStationDumpAsync(RouterStationDumpRequest request)
    {
        var node = await _db.IoTNodes.FindAsync(request.IoTNodeId)
            ?? throw new KeyNotFoundException("IoT node not found.");
        var eventTimestamp = _time.IsFakeTimeEnabled ? _time.UtcNow : request.Timestamp;

        // Update node status
        node.Status = IoTNodeStatus.Online;
        node.LastSeen = eventTimestamp;

        foreach (var station in request.Stations)
        {
            // Log the WiFi connection event
            var log = new WifiConnectionLog
            {
                IoTNodeId = request.IoTNodeId,
                ClientMacAddress = station.MacAddress.ToUpper(),
                ClientIpAddress = station.IpAddress,
                ClientHostname = station.Hostname,
                SignalStrengthDbm = station.SignalStrengthDbm,
                EventType = ConnectionEventType.SignalUpdate,
                Timestamp = eventTimestamp,
                WifiInterface = station.Interface
            };
            _db.WifiConnectionLogs.Add(log);

            // Try to match MAC to a student and process attendance
            var device = await _deviceService.FindByMacAsync(station.MacAddress);
            if (device != null)
            {
                device.LastSeen = eventTimestamp;
                await _signalService.ProcessSignalDataAsync(
                    device.StudentId,
                    node,
                    station.SignalStrengthDbm,
                    eventTimestamp);
            }
        }

        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Get current status of a router/IoT node with connected clients.
    /// </summary>
    public async Task<RouterStatusDto> GetRouterStatusAsync(Guid iotNodeId)
    {
        var node = await _db.IoTNodes.FindAsync(iotNodeId)
            ?? throw new KeyNotFoundException("IoT node not found.");

        // Get latest connection logs (last 5 minutes)
        var cutoff = _time.UtcNow.AddMinutes(-5);
        var recentLogs = await _db.WifiConnectionLogs
            .Where(w => w.IoTNodeId == iotNodeId && w.Timestamp > cutoff)
            .GroupBy(w => w.ClientMacAddress)
            .Select(g => g.OrderByDescending(w => w.Timestamp).First())
            .ToListAsync();

        var clients = new List<ConnectedClientDto>();
        foreach (var log in recentLogs)
        {
            var device = await _deviceService.FindByMacAsync(log.ClientMacAddress);
            clients.Add(new ConnectedClientDto(
                log.ClientMacAddress,
                log.ClientIpAddress,
                log.ClientHostname,
                log.SignalStrengthDbm,
                device?.Student != null ? $"{device.Student.FirstName} {device.Student.LastName}" : null,
                device?.StudentId
            ));
        }

        return new RouterStatusDto(
            iotNodeId,
            node.Status.ToString(),
            clients.Count,
            node.LastSeen,
            clients
        );
    }

    /// <summary>
    /// Get live attendance data for a specific lecture happening now.
    /// </summary>
    public async Task<List<LiveAttendanceDto>> GetLiveAttendanceAsync(Guid lectureId)
    {
        var lecture = await _db.Lectures
            .Include(l => l.Room).ThenInclude(r => r!.IoTNode)
            .Include(l => l.Schedules)
            .Include(l => l.Enrollments).ThenInclude(e => e.Student)
                .ThenInclude(s => s.StudentDevices)
            .FirstOrDefaultAsync(l => l.Id == lectureId)
            ?? throw new KeyNotFoundException("Lecture not found.");

        var iotNode = lecture.Room?.IoTNode;
        var localNow = _time.LocalNow;
        var localToday = DateOnly.FromDateTime(localNow);
        var localTime = TimeOnly.FromDateTime(localNow);
        var localDayOfWeek = ((int)localNow.DayOfWeek + 6) % 7; // 0=Monday
        var lectureIsNow = lecture.Schedules.Any(s =>
            s.DayOfWeek == localDayOfWeek &&
            (!s.ValidFrom.HasValue || s.ValidFrom.Value <= localToday) &&
            (!s.ValidUntil.HasValue || s.ValidUntil.Value >= localToday) &&
            s.StartTime <= localTime &&
            s.EndTime >= localTime);

        // Last RADIUS accounting (or Start): without new packets the session is treated as stale for the UI after this window.
        // Station dump (Wi‑Fi) only sees L2 association — can appear before captive portal and linger after disconnect.
        var liveEvidenceCutoff = _time.UtcNow.AddMinutes(-2);

        var result = new List<LiveAttendanceDto>();

        foreach (var enrollment in lecture.Enrollments)
        {
            var student = enrollment.Student;
            var activeMacs = student.StudentDevices
                .Where(d => d.IsActive)
                .Select(d => d.MacAddress)
                .ToList();

            var todayUtc = _time.ToUtc(_time.LocalToday, TimeOnly.MinValue);
            HotspotSession? radiusSession = null;
            if (iotNode != null && lectureIsNow)
            {
                radiusSession = await _db.HotspotSessions
                    .Where(h =>
                        h.StudentId == student.Id &&
                        h.IoTNodeId == iotNode.Id &&
                        h.IsActive &&
                        h.EndTime == null &&
                        h.StartTime >= todayUtc &&
                        (h.LastAccountingAt ?? h.StartTime) >= liveEvidenceCutoff)
                    .OrderByDescending(h => h.StartTime)
                    .FirstOrDefaultAsync();
            }

            var radiusConnected = radiusSession != null;

            // Signal only when a valid RADIUS session exists (hotspot completed); otherwise Wi‑Fi alone would show “online”.
            WifiConnectionLog? latestLog = null;
            if (iotNode != null && activeMacs.Count != 0 && radiusConnected)
            {
                latestLog = await _db.WifiConnectionLogs
                    .Where(w =>
                        w.IoTNodeId == iotNode.Id &&
                        activeMacs.Contains(w.ClientMacAddress) &&
                        w.Timestamp > liveEvidenceCutoff)
                    .OrderByDescending(w => w.Timestamp)
                    .FirstOrDefaultAsync();
            }

            // Presence from RADIUS only; station dump no longer marks “connected” without accounting.
            var isConnected = radiusConnected;

            // Prefer the MAC from the active RADIUS session (real currently authenticated device).
            var deviceMac = radiusSession?.DeviceMac ?? activeMacs.FirstOrDefault();

            // Since / duration from RADIUS session (not first Wi‑Fi log of the day).
            DateTime? connectedSince = null;
            double? connectionMinutes = null;
            if (isConnected && radiusSession != null)
            {
                connectedSince = radiusSession.StartTime;
                connectionMinutes = radiusSession.DurationMinutes.HasValue && radiusSession.DurationMinutes > 0
                    ? radiusSession.DurationMinutes
                    : (_time.UtcNow - radiusSession.StartTime).TotalMinutes;
            }

            result.Add(new LiveAttendanceDto(
                student.Id,
                $"{student.FirstName} {student.LastName}",
                deviceMac,
                latestLog?.SignalStrengthDbm,
                connectedSince,
                connectionMinutes,
                isConnected ? "Connected" : "Disconnected"
            ));
        }

        return result.OrderBy(r => r.Status).ThenBy(r => r.StudentName).ToList();
    }
}
