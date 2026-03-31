namespace IoTAttendance.API.DTOs;

public record RoomDto(
    Guid Id,
    string Name,
    int Capacity,
    string Location,
    IoTNodeDto? IoTNode,
    DateTime CreatedAt
);

public record CreateRoomRequest(
    string Name,
    int Capacity,
    string Location
);

public record UpdateRoomRequest(
    string? Name,
    int? Capacity,
    string? Location
);
