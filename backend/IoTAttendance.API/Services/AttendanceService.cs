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
    private readonly IAppTimeProvider _time;

    public AttendanceService(AppDbContext db, ILogger<AttendanceService> logger, IAppTimeProvider time)
    {
        _db = db;
        _logger = logger;
        _time = time;
    }

    public async Task<List<AttendanceRecordDto>> GetByLectureAsync(Guid lectureId, string? date = null)
    {
        // Auto-create attendance records from RADIUS hotspot sessions
        var targetDate = date != null ? DateOnly.Parse(date) : _time.LocalToday;
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
        var today = _time.LocalToday;
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
        var today = _time.LocalToday;
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
            existing.UpdatedAt = _time.UtcNow;
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
                CheckInTime = _time.UtcNow
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
        record.UpdatedAt = _time.UtcNow;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<List<DailyAttendanceSummaryDto>> GetDailySummaryAsync(
        Guid lectureId, string startDate, string endDate)
    {
        var start = DateOnly.Parse(startDate);
        var end = DateOnly.Parse(endDate);

        var today = _time.LocalToday;
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
            var now = _time.UtcNow;
            var staleWindow = TimeSpan.FromMinutes(2);

            var enrolledStudentIds = await _db.Enrollments
                .Where(e => e.LectureId == lectureId)
                .Select(e => e.StudentId)
                .ToListAsync();

            if (enrolledStudentIds.Count == 0) return;

            var dayStartUtc = _time.ToUtc(date, TimeOnly.MinValue);
            var dayEndUtc = _time.ToUtc(date.AddDays(1), TimeOnly.MinValue).AddTicks(-1);

            var sessions = await _db.HotspotSessions
                .Where(s =>
                    enrolledStudentIds.Contains(s.StudentId) &&
                    s.StartTime <= dayEndUtc &&
                    ((s.EndTime ?? now) >= dayStartUtc))
                .ToListAsync();

            if (sessions.Count == 0)
            {
                _logger.LogDebug("MaterializeFromSessions: No hotspot sessions found for lecture {LectureId} on {Date}. " +
                    "EnrolledStudents={Count}, DayRange={Start}..{End}",
                    lectureId, date, enrolledStudentIds.Count, dayStartUtc, dayEndUtc);
                return;
            }

            // Attendance can be materialized only for actual lecture slots on that day.
            var dayOfWeek = ((int)date.DayOfWeek + 6) % 7; // 0=Monday
            var scheduleSlots = await _db.Schedules
                .Where(s =>
                    s.LectureId == lectureId &&
                    s.DayOfWeek == dayOfWeek &&
                    (!s.ValidFrom.HasValue || s.ValidFrom.Value <= date) &&
                    (!s.ValidUntil.HasValue || s.ValidUntil.Value >= date))
                .OrderBy(s => s.StartTime)
                .ToListAsync();

            if (scheduleSlots.Count == 0)
            {
                _logger.LogDebug(
                    "MaterializeFromSessions: No schedule slots for lecture {LectureId} on {Date} (weekday {Weekday})",
                    lectureId, date, dayOfWeek);
                return;
            }

            var firstSlotStartUtc = scheduleSlots
                .Select(s => _time.ToUtc(date, s.StartTime))
                .Min();
            var lastSlotEndUtc = scheduleSlots
                .Select(s => _time.ToUtc(date, s.EndTime))
                .Max();
            var totalLectureMinutes = scheduleSlots
                .Sum(s => (_time.ToUtc(date, s.EndTime) - _time.ToUtc(date, s.StartTime)).TotalMinutes);
            if (totalLectureMinutes <= 0)
                totalLectureMinutes = 1;
            var minPresentMinutes = totalLectureMinutes / 2.0;
            var canFinalizeAbsence = date < _time.LocalToday || (date == _time.LocalToday && now >= lastSlotEndUtc);

            // Group sessions by student — one attendance record per student per lecture/day
            var changed = false;
            var grouped = sessions.GroupBy(s => s.StudentId);
            var seenStudents = new HashSet<Guid>();

            foreach (var group in grouped)
            {
                var studentId = group.Key;
                seenStudents.Add(studentId);

                // Keep only the overlap with scheduled lecture windows.
                double totalDuration = 0;
                DateTime? firstOverlap = null;
                DateTime? lastOverlap = null;
                DateTime? firstSlotStart = null;

                foreach (var session in group)
                {
                    var sessionStart = session.StartTime < dayStartUtc ? dayStartUtc : session.StartTime;
                    DateTime sessionEndRaw;
                    if (session.EndTime.HasValue)
                    {
                        sessionEndRaw = session.EndTime.Value;
                    }
                    else
                    {
                        var lastSeen = session.LastAccountingAt ?? session.StartTime;
                        var isFreshActive = date == _time.LocalToday &&
                            session.IsActive &&
                            lastSeen >= now.Subtract(staleWindow);

                        if (isFreshActive)
                        {
                            // While session is currently active and fresh, let duration grow in real-time.
                            sessionEndRaw = now;
                        }
                        else
                        {
                            // If updates stopped, avoid phantom growth beyond a short grace window.
                            var capped = lastSeen.Add(staleWindow);
                            sessionEndRaw = capped < dayEndUtc ? capped : dayEndUtc;
                        }
                    }
                    var sessionEnd = sessionEndRaw > dayEndUtc ? dayEndUtc : sessionEndRaw;
                    if (sessionEnd <= sessionStart) continue;

                    foreach (var slot in scheduleSlots)
                    {
                        var slotStart = _time.ToUtc(date, slot.StartTime);
                        var slotEnd = _time.ToUtc(date, slot.EndTime);

                        var overlapStart = sessionStart > slotStart ? sessionStart : slotStart;
                        var overlapEnd = sessionEnd < slotEnd ? sessionEnd : slotEnd;
                        if (overlapEnd <= overlapStart) continue;

                        totalDuration += (overlapEnd - overlapStart).TotalMinutes;

                        if (!firstOverlap.HasValue || overlapStart < firstOverlap.Value)
                            firstOverlap = overlapStart;
                        if (!lastOverlap.HasValue || overlapEnd > lastOverlap.Value)
                            lastOverlap = overlapEnd;
                        if (!firstSlotStart.HasValue || slotStart < firstSlotStart.Value)
                            firstSlotStart = slotStart;
                    }
                }

                if (totalDuration <= 0 || !firstOverlap.HasValue)
                    continue;

                var avgSignal = group.Where(s => s.AvgSignalDbm.HasValue)
                    .Select(s => s.AvgSignalDbm!.Value).DefaultIfEmpty(0).Average();

                var status = AttendanceStatus.Present;
                if (totalDuration < minPresentMinutes)
                {
                    status = AttendanceStatus.Absent;
                }
                else if (firstSlotStart.HasValue)
                {
                    var minutesLate = (firstOverlap.Value - firstSlotStart.Value).TotalMinutes;
                    if (minutesLate > 10) status = AttendanceStatus.Late;
                }

                var existing = await _db.AttendanceRecords
                    .FirstOrDefaultAsync(a =>
                        a.StudentId == studentId &&
                        a.LectureId == lectureId &&
                        a.Date == date);

                if (existing != null)
                {
                    // Update with latest session data (don't touch manually overridden records)
                    if (!existing.IsManualOverride)
                    {
                        existing.CheckInTime = firstOverlap.Value;
                        existing.CheckOutTime = lastOverlap;
                        existing.ConnectionDurationMinutes = totalDuration;
                        existing.AvgSignalStrengthDbm = avgSignal;
                        existing.Status = status;
                        existing.UpdatedAt = _time.UtcNow;
                        changed = true;
                    }
                }
                else
                {
                    _db.AttendanceRecords.Add(new AttendanceRecord
                    {
                        LectureId = lectureId,
                        StudentId = studentId,
                        ScheduleId = scheduleSlots[0].Id,
                        Date = date,
                        Status = status,
                        CheckInTime = firstOverlap.Value,
                        CheckOutTime = lastOverlap,
                        SignalStrengthDbm = (int)Math.Round(avgSignal),
                        AvgSignalStrengthDbm = avgSignal,
                        ConnectionDurationMinutes = totalDuration
                    });
                    changed = true;
                }
            }

            // Finalize students with no overlap as absent after lecture window is over.
            if (canFinalizeAbsence)
            {
                foreach (var studentId in enrolledStudentIds)
                {
                    if (seenStudents.Contains(studentId))
                        continue;

                    var existing = await _db.AttendanceRecords
                        .FirstOrDefaultAsync(a =>
                            a.StudentId == studentId &&
                            a.LectureId == lectureId &&
                            a.Date == date);

                    if (existing != null)
                    {
                        if (!existing.IsManualOverride &&
                            (existing.Status != AttendanceStatus.Absent || (existing.ConnectionDurationMinutes ?? 0) > 0))
                        {
                            existing.Status = AttendanceStatus.Absent;
                            existing.ConnectionDurationMinutes = 0;
                            existing.CheckInTime = null;
                            existing.CheckOutTime = null;
                            existing.UpdatedAt = _time.UtcNow;
                            changed = true;
                        }
                        continue;
                    }

                    _db.AttendanceRecords.Add(new AttendanceRecord
                    {
                        LectureId = lectureId,
                        StudentId = studentId,
                        ScheduleId = scheduleSlots[0].Id,
                        Date = date,
                        Status = AttendanceStatus.Absent,
                        ConnectionDurationMinutes = 0
                    });
                    changed = true;
                }
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
