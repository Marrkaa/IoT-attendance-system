using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class IoTNodeService
{
    private readonly AppDbContext _db;

    public IoTNodeService(AppDbContext db) => _db = db;

    public async Task<List<IoTNodeDto>> GetAllAsync()
    {
        var nodes = await _db.IoTNodes.Include(n => n.Room).ToListAsync();
        var result = new List<IoTNodeDto>();

        foreach (var node in nodes)
        {
            var connectedCount = await _db.WifiConnectionLogs
                .Where(w => w.IoTNodeId == node.Id && w.EventType == ConnectionEventType.Connected)
                .Select(w => w.ClientMacAddress)
                .Distinct()
                .CountAsync();

            result.Add(MapToDto(node, connectedCount));
        }

        return result;
    }

    public async Task<IoTNodeDto> GetByIdAsync(Guid id)
    {
        var node = await _db.IoTNodes.Include(n => n.Room).FirstOrDefaultAsync(n => n.Id == id)
            ?? throw new KeyNotFoundException("IoT mazgas nerastas.");

        var connectedCount = await _db.WifiConnectionLogs
            .Where(w => w.IoTNodeId == node.Id && w.EventType == ConnectionEventType.Connected)
            .Select(w => w.ClientMacAddress)
            .Distinct()
            .CountAsync();

        return MapToDto(node, connectedCount);
    }

    public async Task<IoTNodeDto> CreateAsync(CreateIoTNodeRequest request)
    {
        var roomExists = await _db.Rooms.AnyAsync(r => r.Id == request.RoomId);
        if (!roomExists)
            throw new KeyNotFoundException("Auditorija nerasta.");

        var existingNode = await _db.IoTNodes.AnyAsync(n => n.RoomId == request.RoomId);
        if (existingNode)
            throw new InvalidOperationException("Šiai auditorijai jau priskirtas IoT mazgas.");

        var node = new IoTNode
        {
            RoomId = request.RoomId,
            MacAddress = request.MacAddress.ToUpper(),
            Hostname = request.Hostname,
            IpAddress = request.IpAddress,
            HotspotSsid = request.HotspotSsid,
            SignalThresholdDbm = request.SignalThresholdDbm
        };

        _db.IoTNodes.Add(node);
        await _db.SaveChangesAsync();
        return MapToDto(node, 0);
    }

    public async Task<IoTNodeDto> UpdateAsync(Guid id, UpdateIoTNodeRequest request)
    {
        var node = await _db.IoTNodes.FindAsync(id)
            ?? throw new KeyNotFoundException("IoT mazgas nerastas.");

        if (request.Hostname != null) node.Hostname = request.Hostname;
        if (request.IpAddress != null) node.IpAddress = request.IpAddress;
        if (request.HotspotSsid != null) node.HotspotSsid = request.HotspotSsid;
        if (request.SignalThresholdDbm.HasValue) node.SignalThresholdDbm = request.SignalThresholdDbm.Value;
        if (request.Status != null) node.Status = Enum.Parse<IoTNodeStatus>(request.Status);

        await _db.SaveChangesAsync();
        return MapToDto(node, 0);
    }

    public async Task DeleteAsync(Guid id)
    {
        var node = await _db.IoTNodes.FindAsync(id)
            ?? throw new KeyNotFoundException("IoT mazgas nerastas.");
        _db.IoTNodes.Remove(node);
        await _db.SaveChangesAsync();
    }

    public static IoTNodeDto MapToDto(IoTNode node, int connectedCount) => new(
        node.Id, node.RoomId, node.MacAddress, node.Hostname,
        node.IpAddress, node.Status.ToString(), node.LastSeen,
        node.FirmwareVersion, node.Model, node.HotspotSsid,
        node.SignalThresholdDbm, connectedCount
    );
}
