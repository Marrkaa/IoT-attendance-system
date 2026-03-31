using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly EnrollmentService _enrollmentService;

    public EnrollmentsController(EnrollmentService enrollmentService)
        => _enrollmentService = enrollmentService;

    [HttpGet("lecture/{lectureId}")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetByLecture(Guid lectureId)
    {
        var enrollments = await _enrollmentService.GetByLectureAsync(lectureId);
        return Ok(enrollments);
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetByStudent(Guid studentId)
    {
        var enrollments = await _enrollmentService.GetByStudentAsync(studentId);
        return Ok(enrollments);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<EnrollmentDto>> Create(CreateEnrollmentRequest request)
    {
        var enrollment = await _enrollmentService.CreateAsync(request);
        return Created("", enrollment);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _enrollmentService.DeleteAsync(id);
        return NoContent();
    }
}
