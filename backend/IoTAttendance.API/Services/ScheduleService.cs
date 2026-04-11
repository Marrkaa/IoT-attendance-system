using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class ScheduleService
{
    private readonly AppDbContext _db;

    public ScheduleService(AppDbContext db) => _db = db;

    public async Task<List<ScheduleDto>> GetAllAsync(Guid? lectureId = null)
    {
        var query = _db.Schedules.Include(s => s.Lecture).AsQueryable();

        if (lectureId.HasValue)
            query = query.Where(s => s.LectureId == lectureId.Value);

        var schedules = await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToListAsync();
        return schedules.Select(MapToDto).ToList();
    }

    public async Task<ScheduleDto> GetByIdAsync(Guid id)
    {
        var schedule = await _db.Schedules.Include(s => s.Lecture).FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException("Schedule not found.");
        return MapToDto(schedule);
    }

    public async Task<ScheduleDto> CreateAsync(CreateScheduleRequest request)
    {
        var schedule = new Schedule
        {
            LectureId = request.LectureId,
            DayOfWeek = request.DayOfWeek,
            StartTime = TimeOnly.Parse(request.StartTime),
            EndTime = TimeOnly.Parse(request.EndTime),
            ValidFrom = request.ValidFrom != null ? DateOnly.Parse(request.ValidFrom) : null,
            ValidUntil = request.ValidUntil != null ? DateOnly.Parse(request.ValidUntil) : null
        };

        _db.Schedules.Add(schedule);
        await _db.SaveChangesAsync();
        return MapToDto(schedule);
    }

    public async Task<ScheduleDto> UpdateAsync(Guid id, UpdateScheduleRequest request)
    {
        var schedule = await _db.Schedules.FindAsync(id)
            ?? throw new KeyNotFoundException("Schedule not found.");

        if (request.DayOfWeek.HasValue) schedule.DayOfWeek = request.DayOfWeek.Value;
        if (request.StartTime != null) schedule.StartTime = TimeOnly.Parse(request.StartTime);
        if (request.EndTime != null) schedule.EndTime = TimeOnly.Parse(request.EndTime);
        if (request.ValidFrom != null) schedule.ValidFrom = DateOnly.Parse(request.ValidFrom);
        if (request.ValidUntil != null) schedule.ValidUntil = DateOnly.Parse(request.ValidUntil);

        await _db.SaveChangesAsync();
        return MapToDto(schedule);
    }

    public async Task DeleteAsync(Guid id)
    {
        var schedule = await _db.Schedules.FindAsync(id)
            ?? throw new KeyNotFoundException("Schedule not found.");
        _db.Schedules.Remove(schedule);
        await _db.SaveChangesAsync();
    }

    public static ScheduleDto MapToDto(Schedule s) => new(
        s.Id, s.LectureId, s.DayOfWeek,
        s.StartTime.ToString("HH:mm"), s.EndTime.ToString("HH:mm"),
        s.ValidFrom?.ToString("yyyy-MM-dd"), s.ValidUntil?.ToString("yyyy-MM-dd"),
        null // avoid circular reference
    );
}
