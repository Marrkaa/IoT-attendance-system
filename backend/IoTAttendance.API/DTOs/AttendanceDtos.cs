namespace IoTAttendance.API.DTOs;

public record AttendanceRecordDto(
    Guid Id,
    Guid LectureId,
    Guid StudentId,
    Guid ScheduleId,
    string Date,
    string Status,
    DateTime? CheckInTime,
    DateTime? CheckOutTime,
    int? SignalStrengthDbm,
    double? AvgSignalStrengthDbm,
    double? ConnectionDurationMinutes,
    bool IsManualOverride,
    UserDto? Student,
    LectureDto? Lecture
);

public record ManualAttendanceRequest(
    Guid StudentId,
    Guid LectureId,
    Guid ScheduleId,
    string Date,
    string Status,
    string? Reason
);

public record UpdateAttendanceRequest(
    string Status,
    string? Reason
);

public record AttendanceStatsDto(
    int TotalLectures,
    int AttendedLectures,
    int LateLectures,
    int AbsentLectures,
    double AttendancePercentage
);

public record LiveAttendanceDto(
    Guid StudentId,
    string StudentName,
    string? DeviceMac,
    int? SignalStrengthDbm,
    DateTime? ConnectedSince,
    double? ConnectionMinutes,
    string Status
);

public record DailyAttendanceSummaryDto(
    string Date,
    int Present,
    int Late,
    int Absent,
    int Total
);
