namespace IoTAttendance.API.DTOs;

public record StudentDeviceDto(
    Guid Id,
    Guid StudentId,
    string MacAddress,
    string? DeviceName,
    bool IsActive,
    DateTime RegisteredAt,
    DateTime? LastSeen,
    string? StudentName
);

public record RegisterDeviceRequest(
    Guid StudentId,
    string MacAddress,
    string? DeviceName
);

public record UpdateDeviceRequest(
    string? DeviceName,
    bool? IsActive
);
