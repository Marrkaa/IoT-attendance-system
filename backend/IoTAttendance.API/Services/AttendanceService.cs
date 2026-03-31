using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class AttendanceService
{
    private readonly AppDbContext _db;

    public AttendanceService(AppDbContext db) => _db = db;

    public async Task<List<AttendanceRecordDto>> GetByLectureAsync(Guid lectureId, string? date = null)
    {
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
                a.ScheduleId == request.ScheduleId &&
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
            ?? throw new KeyNotFoundException("Lankomumo įrašas nerastas.");

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

    private async Task<AttendanceRecordDto> GetByIdAsync(Guid id)
    {
        var record = await _db.AttendanceRecords
            .Include(a => a.Student)
            .Include(a => a.Lecture)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException("Lankomumo įrašas nerastas.");
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
