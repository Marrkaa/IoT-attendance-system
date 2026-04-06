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

    public RouterPollingService(
        AppDbContext db,
        StudentDeviceService deviceService,
        SignalProcessingService signalService)
    {
        _db = db;
        _deviceService = deviceService;
        _signalService = signalService;
    }

    /// <summary>
    /// Process station dump data from a router.
    /// Called periodically by the router's cron script via REST API.
    /// </summary>
    public async Task ProcessStationDumpAsync(RouterStationDumpRequest request)
    {
        var node = await _db.IoTNodes.FindAsync(request.IoTNodeId)
            ?? throw new KeyNotFoundException("IoT mazgas nerastas.");

        // Update node status
        node.Status = IoTNodeStatus.Online;
        node.LastSeen = request.Timestamp;

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
                Timestamp = request.Timestamp,
                WifiInterface = station.Interface
            };
            _db.WifiConnectionLogs.Add(log);

            // Try to match MAC to a student and process attendance
            var device = await _deviceService.FindByMacAsync(station.MacAddress);
            if (device != null)
            {
                device.LastSeen = request.Timestamp;
                await _signalService.ProcessSignalDataAsync(
                    device.StudentId,
                    node,
                    station.SignalStrengthDbm,
                    request.Timestamp);
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
            ?? throw new KeyNotFoundException("IoT mazgas nerastas.");

        // Get latest connection logs (last 5 minutes)
        var cutoff = DateTime.UtcNow.AddMinutes(-5);
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
            .Include(l => l.Enrollments).ThenInclude(e => e.Student)
                .ThenInclude(s => s.StudentDevices)
            .FirstOrDefaultAsync(l => l.Id == lectureId)
            ?? throw new KeyNotFoundException("Paskaita nerasta.");

        var iotNode = lecture.Room?.IoTNode;
        var cutoff = DateTime.UtcNow.AddMinutes(-5);

        var result = new List<LiveAttendanceDto>();

        foreach (var enrollment in lecture.Enrollments)
        {
            var student = enrollment.Student;
            var activeMacs = student.StudentDevices
                .Where(d => d.IsActive)
                .Select(d => d.MacAddress)
                .ToList();

            WifiConnectionLog? latestLog = null;
            if (iotNode != null && activeMacs.Count != 0)
            {
                latestLog = await _db.WifiConnectionLogs
                    .Where(w =>
                        w.IoTNodeId == iotNode.Id &&
                        activeMacs.Contains(w.ClientMacAddress) &&
                        w.Timestamp > cutoff)
                    .OrderByDescending(w => w.Timestamp)
                    .FirstOrDefaultAsync();
            }

            // Get first connection today for duration
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var firstConnection = iotNode != null && activeMacs.Count != 0
                ? await _db.WifiConnectionLogs
                    .Where(w =>
                        w.IoTNodeId == iotNode.Id &&
                        activeMacs.Contains(w.ClientMacAddress) &&
                        DateOnly.FromDateTime(w.Timestamp) == today)
                    .OrderBy(w => w.Timestamp)
                    .FirstOrDefaultAsync()
                : null;

            var todayUtc = DateTime.UtcNow.Date;
            HotspotSession? radiusSession = null;
            if (iotNode != null)
            {
                radiusSession = await _db.HotspotSessions
                    .Where(h =>
                        h.StudentId == student.Id &&
                        h.IoTNodeId == iotNode.Id &&
                        h.IsActive &&
                        h.EndTime == null &&
                        h.StartTime >= todayUtc)
                    .OrderByDescending(h => h.StartTime)
                    .FirstOrDefaultAsync();
            }

            var radiusConnected = radiusSession != null;
            var isConnected = latestLog != null || radiusConnected;

            var deviceMac = activeMacs.FirstOrDefault() ?? radiusSession?.DeviceMac;

            DateTime? connectedSince = firstConnection?.Timestamp ?? radiusSession?.StartTime;
            double? connectionMinutes = null;
            if (firstConnection != null)
                connectionMinutes = (DateTime.UtcNow - firstConnection.Timestamp).TotalMinutes;
            else if (radiusSession != null)
            {
                connectionMinutes = radiusSession.DurationMinutes.HasValue && radiusSession.DurationMinutes > 0
                    ? radiusSession.DurationMinutes
                    : (DateTime.UtcNow - radiusSession.StartTime).TotalMinutes;
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
