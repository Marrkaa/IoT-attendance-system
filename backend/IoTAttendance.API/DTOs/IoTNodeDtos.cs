namespace IoTAttendance.API.DTOs;

public record IoTNodeDto(
    Guid Id,
    Guid RoomId,
    string MacAddress,
    string Hostname,
    string? IpAddress,
    string Status,
    DateTime? LastSeen,
    string? FirmwareVersion,
    string Model,
    string HotspotSsid,
    int SignalThresholdDbm,
    int ConnectedDevicesCount
);

public record CreateIoTNodeRequest(
    Guid RoomId,
    string MacAddress,
    string Hostname,
    string? IpAddress,
    string HotspotSsid,
    int SignalThresholdDbm = -70
);

public record UpdateIoTNodeRequest(
    string? Hostname,
    string? IpAddress,
    string? HotspotSsid,
    int? SignalThresholdDbm,
    string? Status
);
