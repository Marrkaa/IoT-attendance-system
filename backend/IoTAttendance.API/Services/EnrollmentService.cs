using IoTAttendance.API.Data;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Services;

public class EnrollmentService
{
    private readonly AppDbContext _db;

    public EnrollmentService(AppDbContext db) => _db = db;

    public async Task<List<EnrollmentDto>> GetByLectureAsync(Guid lectureId)
    {
        var enrollments = await _db.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Lecture)
            .Where(e => e.LectureId == lectureId)
            .ToListAsync();

        return enrollments.Select(MapToDto).ToList();
    }

    public async Task<List<EnrollmentDto>> GetByStudentAsync(Guid studentId)
    {
        var enrollments = await _db.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Lecture).ThenInclude(l => l.Room)
            .Include(e => e.Lecture).ThenInclude(l => l.Lecturer)
            .Include(e => e.Lecture).ThenInclude(l => l.Schedules)
            .Where(e => e.StudentId == studentId)
            .ToListAsync();

        return enrollments.Select(MapToDto).ToList();
    }

    public async Task<EnrollmentDto> CreateAsync(CreateEnrollmentRequest request)
    {
        var exists = await _db.Enrollments
            .AnyAsync(e => e.StudentId == request.StudentId && e.LectureId == request.LectureId);
        if (exists)
            throw new InvalidOperationException("Studentas jau priskirtas šiai paskaitai.");

        var enrollment = new Enrollment
        {
            StudentId = request.StudentId,
            LectureId = request.LectureId
        };

        _db.Enrollments.Add(enrollment);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(enrollment.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var enrollment = await _db.Enrollments.FindAsync(id)
            ?? throw new KeyNotFoundException("Priskyrimas nerastas.");
        _db.Enrollments.Remove(enrollment);
        await _db.SaveChangesAsync();
    }

    private async Task<EnrollmentDto> GetByIdAsync(Guid id)
    {
        var enrollment = await _db.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Lecture)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException("Priskyrimas nerastas.");
        return MapToDto(enrollment);
    }

    public static EnrollmentDto MapToDto(Enrollment e) => new(
        e.Id, e.StudentId, e.LectureId, e.EnrolledAt,
        e.Student != null ? AuthService.MapToDto(e.Student) : null,
        e.Lecture != null ? LectureService.MapToDto(e.Lecture) : null
    );
}
