using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IoTAttendance.API.Services;

public class AttendanceService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AttendanceService> _logger;

    public AttendanceService(AppDbContext db, ILogger<AttendanceService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<AttendanceRecordDto>> GetByLectureAsync(Guid lectureId, string? date = null)
    {
        // Auto-create attendance records from RADIUS hotspot sessions
        var targetDate = date != null ? DateOnly.Parse(date) : DateOnly.FromDateTime(DateTime.UtcNow);
        await MaterializeFromSessionsAsync(lectureId, targetDate);

        var query = _db.AttendanceRecords
            .Include(a => a.Student)
            .Include(a => a.Lecture)
            .Where(a => a.LectureId == lectureId);

        if (date != null)
            query = query.Where(a => a.Date == DateOnly.Parse(date));

        var records = await query.OrderBy(a => a.Student.LastName).ToListAsync();
        return records.Select(MapToDto).ToList();
    }

    public async Task<List<AttendanceRecordDto>> GetByStudentAsync(Guid studentId, Guid? lectureId = null)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var enrolledLectureIds = await _db.Enrollments
            .Where(e => e.StudentId == studentId)
            .Select(e => e.LectureId)
            .ToListAsync();

        foreach (var lid in enrolledLectureIds)
            await MaterializeFromSessionsAsync(lid, today);

        var query = _db.AttendanceRecords
            .Include(a => a.Student)
            .Include(a => a.Lecture)
            .Where(a => a.StudentId == studentId);

        if (lectureId.HasValue)
            query = query.Where(a => a.LectureId == lectureId.Value);

        var records = await query.OrderByDescending(a => a.Date).ToListAsync();
        return records.Select(MapToDto).ToList();
    }

    public async Task<AttendanceStatsDto> GetStatsAsync(Guid studentId, Guid? lectureId = null)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var enrolledLectureIds = await _db.Enrollments
            .Where(e => e.StudentId == studentId)
            .Select(e => e.LectureId)
            .ToListAsync();

        foreach (var lid in enrolledLectureIds)
            await MaterializeFromSessionsAsync(lid, today);

        var query = _db.AttendanceRecords.Where(a => a.StudentId == studentId);
        if (lectureId.HasValue)
            query = query.Where(a => a.LectureId == lectureId.Value);

        var records = await query.ToListAsync();
        var total = records.Count;
        var present = records.Count(r => r.Status == AttendanceStatus.Present);
        var late = records.Count(r => r.Status == AttendanceStatus.Late);
        var absent = records.Count(r => r.Status == AttendanceStatus.Absent);

        return new AttendanceStatsDto(
            total, present, late, absent,
            total > 0 ? Math.Round((present + late) * 100.0 / total, 1) : 0
        );
    }

    public async Task<AttendanceRecordDto> ManualMarkAsync(ManualAttendanceRequest request, Guid overrideBy)
    {
        var existing = await _db.AttendanceRecords
            .FirstOrDefaultAsync(a =>
                a.StudentId == request.StudentId &&
                a.LectureId == request.LectureId &&
                a.Date == DateOnly.Parse(request.Date));

        if (existing != null)
        {
            existing.Status = Enum.Parse<AttendanceStatus>(request.Status);
            existing.IsManualOverride = true;
            existing.OverrideBy = overrideBy;
            existing.OverrideReason = request.Reason;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new AttendanceRecord
            {
                LectureId = request.LectureId,
                StudentId = request.StudentId,
                ScheduleId = request.ScheduleId,
                Date = DateOnly.Parse(request.Date),
                Status = Enum.Parse<AttendanceStatus>(request.Status),
                IsManualOverride = true,
                OverrideBy = overrideBy,
                OverrideReason = request.Reason,
                CheckInTime = DateTime.UtcNow
            };
            _db.AttendanceRecords.Add(existing);
        }

        await _db.SaveChangesAsync();
        return await GetByIdAsync(existing.Id);
    }

    public async Task<AttendanceRecordDto> UpdateStatusAsync(Guid id, UpdateAttendanceRequest request, Guid overrideBy)
    {
        var record = await _db.AttendanceRecords.FindAsync(id)
            ?? throw new KeyNotFoundException("Attendance record not found.");

        record.Status = Enum.Parse<AttendanceStatus>(request.Status);
        record.IsManualOverride = true;
        record.OverrideBy = overrideBy;
        record.OverrideReason = request.Reason;
        record.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<List<DailyAttendanceSummaryDto>> GetDailySummaryAsync(
        Guid lectureId, string startDate, string endDate)
    {
        var start = DateOnly.Parse(startDate);
        var end = DateOnly.Parse(endDate);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        for (var d = start; d <= end && d <= today; d = d.AddDays(1))
            await MaterializeFromSessionsAsync(lectureId, d);

        var records = await _db.AttendanceRecords
            .Where(a => a.LectureId == lectureId && a.Date >= start && a.Date <= end)
            .ToListAsync();

        var grouped = records.GroupBy(r => r.Date).Select(g => new DailyAttendanceSummaryDto(
            g.Key.ToString("yyyy-MM-dd"),
            g.Count(r => r.Status == AttendanceStatus.Present),
            g.Count(r => r.Status == AttendanceStatus.Late),
            g.Count(r => r.Status == AttendanceStatus.Absent),
            g.Count()
        )).OrderBy(d => d.Date).ToList();

        return grouped;
    }

    /// <summary>
    /// Creates AttendanceRecord entries from RADIUS HotspotSessions for enrolled students.
    /// Bridges real-time RADIUS presence data with the attendance_records table.
    /// </summary>
    private async Task MaterializeFromSessionsAsync(Guid lectureId, DateOnly date)
    {
        try
        {
            var lecture = await _db.Lectures.FindAsync(lectureId);
            if (lecture == null) return;

            var enrolledStudentIds = await _db.Enrollments
                .Where(e => e.LectureId == lectureId)
                .Select(e => e.StudentId)
                .ToListAsync();

            if (enrolledStudentIds.Count == 0) return;

            var dayStart = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dayEnd = date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

            var sessions = await _db.HotspotSessions
                .Where(s =>
                    enrolledStudentIds.Contains(s.StudentId) &&
                    s.StartTime >= dayStart && s.StartTime <= dayEnd)
                .ToListAsync();

            if (sessions.Count == 0)
            {
                _logger.LogDebug("MaterializeFromSessions: No hotspot sessions found for lecture {LectureId} on {Date}. " +
                    "EnrolledStudents={Count}, DayRange={Start}..{End}",
                    lectureId, date, enrolledStudentIds.Count, dayStart, dayEnd);
                return;
            }

            // Find schedule for this day (optional — sessions may occur outside scheduled time)
            var dayOfWeek = ((int)dayStart.DayOfWeek + 6) % 7; // 0=Monday
            var schedule = await _db.Schedules
                .Where(s => s.LectureId == lectureId && s.DayOfWeek == dayOfWeek)
                .FirstOrDefaultAsync();

            var changed = false;
            foreach (var session in sessions)
            {
                var alreadyExists = await _db.AttendanceRecords
                    .AnyAsync(a =>
                        a.StudentId == session.StudentId &&
                        a.LectureId == lectureId &&
                        a.Date == date);

                if (alreadyExists) continue;

                var duration = session.DurationMinutes
                    ?? (session.EndTime.HasValue
                        ? (session.EndTime.Value - session.StartTime).TotalMinutes
                        : (DateTime.UtcNow - session.StartTime).TotalMinutes);

                var status = AttendanceStatus.Present;
                if (schedule != null)
                {
                    var sessionTime = TimeOnly.FromDateTime(session.StartTime);
                    var minutesLate = (sessionTime - schedule.StartTime).TotalMinutes;
                    if (minutesLate > 10) status = AttendanceStatus.Late;
                }

                _db.AttendanceRecords.Add(new AttendanceRecord
                {
                    LectureId = lectureId,
                    StudentId = session.StudentId,
                    ScheduleId = schedule?.Id,
                    Date = date,
                    Status = status,
                    CheckInTime = session.StartTime,
                    CheckOutTime = session.EndTime,
                    SignalStrengthDbm = session.InitialSignalDbm,
                    AvgSignalStrengthDbm = session.AvgSignalDbm,
                    ConnectionDurationMinutes = duration
                });
                changed = true;

                _logger.LogInformation("MaterializeFromSessions: Created attendance record for student {StudentId}, " +
                    "lecture {LectureId}, date {Date}, status {Status}, duration {Duration:F1} min",
                    session.StudentId, lectureId, date, status, duration);
            }

            if (changed)
                await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MaterializeFromSessions failed for lecture {LectureId}, date {Date}", lectureId, date);
        }
    }

    private async Task<AttendanceRecordDto> GetByIdAsync(Guid id)
    {
        var record = await _db.AttendanceRecords
            .Include(a => a.Student)
            .Include(a => a.Lecture)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Attendance record not found.");
        return MapToDto(record);
    }

    public static AttendanceRecordDto MapToDto(AttendanceRecord a) => new(
        a.Id, a.LectureId, a.StudentId, a.ScheduleId,
        a.Date.ToString("yyyy-MM-dd"), a.Status.ToString(),
        a.CheckInTime, a.CheckOutTime,
        a.SignalStrengthDbm, a.AvgSignalStrengthDbm,
        a.ConnectionDurationMinutes, a.IsManualOverride,
        a.Student != null ? AuthService.MapToDto(a.Student) : null,
        a.Lecture != null ? LectureService.MapToDto(a.Lecture) : null
    );
}
