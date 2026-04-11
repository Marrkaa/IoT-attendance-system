using IoTAttendance.API.Data;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

/// <summary>
/// Processes WiFi signal strength data to determine attendance status.
/// Uses signal strength threshold and connection duration to evaluate
/// whether a student is physically present in the room.
/// </summary>
public class SignalProcessingService
{
    private readonly AppDbContext _db;

    // Minimum connection duration (minutes) to mark as Present
    private const double MinPresentDurationMinutes = 15.0;
    // Late threshold - if connected after this many minutes from lecture start
    private const double LateThresholdMinutes = 10.0;

    public SignalProcessingService(AppDbContext db) => _db = db;

    /// <summary>
    /// Process a signal reading for a student and update attendance if a lecture is active.
    /// </summary>
    public async Task ProcessSignalDataAsync(
        Guid studentId,
        IoTNode node,
        int signalStrengthDbm,
        DateTime timestamp)
    {
        // Find active schedule for this room at the current time
        var now = TimeOnly.FromDateTime(timestamp);
        var dayOfWeek = ((int)timestamp.DayOfWeek + 6) % 7; // Convert to 0=Monday
        var today = DateOnly.FromDateTime(timestamp);

        var activeSchedule = await _db.Schedules
            .Include(s => s.Lecture)
            .Where(s =>
                s.Lecture.RoomId == node.RoomId &&
                s.DayOfWeek == dayOfWeek &&
                s.StartTime <= now &&
                s.EndTime >= now)
            .FirstOrDefaultAsync();

        if (activeSchedule == null) return;

        // Check if student is enrolled in this lecture
        var isEnrolled = await _db.Enrollments
            .AnyAsync(e => e.StudentId == studentId && e.LectureId == activeSchedule.LectureId);
        if (!isEnrolled) return;

        // Signal too weak - student is likely outside the room
        if (signalStrengthDbm < node.SignalThresholdDbm) return;

        // Find or create attendance record for today
        var record = await _db.AttendanceRecords
            .FirstOrDefaultAsync(a =>
                a.StudentId == studentId &&
                a.ScheduleId == activeSchedule.Id &&
                a.Date == today);

        if (record == null)
        {
            // Determine if late
            var minutesSinceStart = (now - activeSchedule.StartTime).TotalMinutes;
            var status = minutesSinceStart > LateThresholdMinutes
                ? AttendanceStatus.Late
                : AttendanceStatus.Present;

            record = new AttendanceRecord
            {
                LectureId = activeSchedule.LectureId,
                StudentId = studentId,
                ScheduleId = activeSchedule.Id,
                Date = today,
                Status = status,
                CheckInTime = timestamp,
                SignalStrengthDbm = signalStrengthDbm,
                AvgSignalStrengthDbm = signalStrengthDbm
            };
            _db.AttendanceRecords.Add(record);
        }
        else if (!record.IsManualOverride)
        {
            // Update running average of signal strength
            var readingCount = record.ConnectionDurationMinutes.HasValue
                ? Math.Max(1, record.ConnectionDurationMinutes.Value)
                : 1;
            record.AvgSignalStrengthDbm = record.AvgSignalStrengthDbm.HasValue
                ? (record.AvgSignalStrengthDbm.Value * readingCount + signalStrengthDbm) / (readingCount + 1)
                : signalStrengthDbm;

            record.SignalStrengthDbm = signalStrengthDbm;
            record.CheckOutTime = timestamp;
            record.ConnectionDurationMinutes = record.CheckInTime.HasValue
                ? (timestamp - record.CheckInTime.Value).TotalMinutes
                : 0;
            record.UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Called at the end of each lecture to finalize attendance records.
    /// Students who were enrolled but never connected get marked as Absent.
    /// </summary>
    public async Task FinalizeAttendanceAsync(Guid scheduleId, DateOnly date)
    {
        var schedule = await _db.Schedules
            .Include(s => s.Lecture).ThenInclude(l => l.Enrollments)
            .FirstOrDefaultAsync(s => s.Id == scheduleId)
            ?? throw new KeyNotFoundException("Schedule not found.");

        foreach (var enrollment in schedule.Lecture.Enrollments)
        {
            var hasRecord = await _db.AttendanceRecords
                .AnyAsync(a =>
                    a.StudentId == enrollment.StudentId &&
                    a.ScheduleId == scheduleId &&
                    a.Date == date);

            if (!hasRecord)
            {
                _db.AttendanceRecords.Add(new AttendanceRecord
                {
                    LectureId = schedule.LectureId,
                    StudentId = enrollment.StudentId,
                    ScheduleId = scheduleId,
                    Date = date,
                    Status = AttendanceStatus.Absent
                });
            }
        }

        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Convert signal strength in dBm to a percentage (0-100).
    /// </summary>
    public static int SignalStrengthToPercent(int dbm)
    {
        if (dbm >= -30) return 100;
        if (dbm <= -90) return 0;
        return (int)((dbm + 90.0) / 60.0 * 100.0);
    }

    /// <summary>
    /// Get signal quality label based on dBm value.
    /// </summary>
    public static string SignalStrengthLabel(int dbm)
    {
        return dbm switch
        {
            >= -30 => "Puikus",
            >= -50 => "Labai geras",
            >= -60 => "Geras",
            >= -70 => "Vidutinis",
            >= -80 => "Silpnas",
            _ => "Labai silpnas"
        };
    }
}
