using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class LectureService
{
    private readonly AppDbContext _db;

    public LectureService(AppDbContext db) => _db = db;

    public async Task<List<LectureDto>> GetAllAsync(Guid? lecturerId = null)
    {
        var query = _db.Lectures
            .Include(l => l.Lecturer)
            .Include(l => l.Room).ThenInclude(r => r.IoTNode)
            .Include(l => l.Schedules)
            .Include(l => l.Enrollments)
            .AsQueryable();

        if (lecturerId.HasValue)
            query = query.Where(l => l.LecturerId == lecturerId.Value);

        var lectures = await query.OrderBy(l => l.Title).ToListAsync();
        return lectures.Select(MapToDto).ToList();
    }

    public async Task<LectureDto> GetByIdAsync(Guid id)
    {
        var lecture = await _db.Lectures
            .Include(l => l.Lecturer)
            .Include(l => l.Room).ThenInclude(r => r.IoTNode)
            .Include(l => l.Schedules)
            .Include(l => l.Enrollments)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new KeyNotFoundException("Paskaita nerasta.");
        return MapToDto(lecture);
    }

    public async Task<LectureDto> CreateAsync(CreateLectureRequest request)
    {
        var lecture = new Lecture
        {
            Title = request.Title,
            Description = request.Description,
            LecturerId = request.LecturerId,
            RoomId = request.RoomId
        };

        _db.Lectures.Add(lecture);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(lecture.Id);
    }

    public async Task<LectureDto> UpdateAsync(Guid id, UpdateLectureRequest request)
    {
        var lecture = await _db.Lectures.FindAsync(id)
            ?? throw new KeyNotFoundException("Paskaita nerasta.");

        if (request.Title != null) lecture.Title = request.Title;
        if (request.Description != null) lecture.Description = request.Description;
        if (request.LecturerId.HasValue) lecture.LecturerId = request.LecturerId.Value;
        if (request.RoomId.HasValue) lecture.RoomId = request.RoomId.Value;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var lecture = await _db.Lectures.FindAsync(id)
            ?? throw new KeyNotFoundException("Paskaita nerasta.");
        _db.Lectures.Remove(lecture);
        await _db.SaveChangesAsync();
    }

    public static LectureDto MapToDto(Lecture l) => new(
        l.Id, l.Title, l.Description, l.LecturerId, l.RoomId,
        l.Lecturer != null ? AuthService.MapToDto(l.Lecturer) : null,
        l.Room != null ? RoomService.MapToDto(l.Room) : null,
        l.Enrollments?.Count ?? 0,
        l.Schedules?.Select(ScheduleService.MapToDto).ToList()
    );
}
