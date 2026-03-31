namespace IoTAttendance.API.DTOs;

// Data received from Teltonika RUTX11 station dump
public record RouterStationInfo(
    string MacAddress,
    string? IpAddress,
    string? Hostname,
    int SignalStrengthDbm,
    string Interface // wlan0 or wlan1
);

// Batch data sent from router polling script
public record RouterStationDumpRequest(
    Guid IoTNodeId,
    List<RouterStationInfo> Stations,
    DateTime Timestamp
);

public record RouterStatusDto(
    Guid IoTNodeId,
    string Status,
    int ConnectedClients,
    DateTime? LastPolled,
    List<ConnectedClientDto> Clients
);

public record ConnectedClientDto(
    string MacAddress,
    string? IpAddress,
    string? Hostname,
    int SignalStrengthDbm,
    string? MatchedStudentName,
    Guid? MatchedStudentId
);

public record EnrollmentDto(
    Guid Id,
    Guid StudentId,
    Guid LectureId,
    DateTime EnrolledAt,
    UserDto? Student,
    LectureDto? Lecture
);

public record CreateEnrollmentRequest(
    Guid StudentId,
    Guid LectureId
);
