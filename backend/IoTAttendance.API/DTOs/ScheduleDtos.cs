namespace IoTAttendance.API.DTOs;

public record ScheduleDto(
    Guid Id,
    Guid LectureId,
    int DayOfWeek,
    string StartTime,
    string EndTime,
    string? ValidFrom,
    string? ValidUntil,
    LectureDto? Lecture
);

public record CreateScheduleRequest(
    Guid LectureId,
    int DayOfWeek,
    string StartTime,
    string EndTime,
    string? ValidFrom,
    string? ValidUntil
);

public record UpdateScheduleRequest(
    int? DayOfWeek,
    string? StartTime,
    string? EndTime,
    string? ValidFrom,
    string? ValidUntil
);
