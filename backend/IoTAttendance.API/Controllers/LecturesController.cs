using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LecturesController : ControllerBase
{
    private readonly LectureService _lectureService;

    public LecturesController(LectureService lectureService) => _lectureService = lectureService;

    [HttpGet]
    public async Task<ActionResult<List<LectureDto>>> GetAll([FromQuery] Guid? lecturerId = null)
    {
        var lectures = await _lectureService.GetAllAsync(lecturerId);
        return Ok(lectures);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LectureDto>> GetById(Guid id)
    {
        var lecture = await _lectureService.GetByIdAsync(id);
        return Ok(lecture);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<LectureDto>> Create(CreateLectureRequest request)
    {
        var lecture = await _lectureService.CreateAsync(request);
        return Created($"api/lectures/{lecture.Id}", lecture);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<LectureDto>> Update(Guid id, UpdateLectureRequest request)
    {
        var lecture = await _lectureService.UpdateAsync(id, request);
        return Ok(lecture);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _lectureService.DeleteAsync(id);
        return NoContent();
    }
}
