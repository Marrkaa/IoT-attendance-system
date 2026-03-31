namespace IoTAttendance.API.DTOs;

public record LectureDto(
    Guid Id,
    string Title,
    string? Description,
    Guid LecturerId,
    Guid RoomId,
    UserDto? Lecturer,
    RoomDto? Room,
    int EnrolledCount,
    List<ScheduleDto>? Schedules
);

public record CreateLectureRequest(
    string Title,
    string? Description,
    Guid LecturerId,
    Guid RoomId
);

public record UpdateLectureRequest(
    string? Title,
    string? Description,
    Guid? LecturerId,
    Guid? RoomId
);
