using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly ScheduleService _scheduleService;

    public SchedulesController(ScheduleService scheduleService) => _scheduleService = scheduleService;

    [HttpGet]
    public async Task<ActionResult<List<ScheduleDto>>> GetAll([FromQuery] Guid? lectureId = null)
    {
        var schedules = await _scheduleService.GetAllAsync(lectureId);
        return Ok(schedules);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleDto>> GetById(Guid id)
    {
        var schedule = await _scheduleService.GetByIdAsync(id);
        return Ok(schedule);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<ScheduleDto>> Create(CreateScheduleRequest request)
    {
        var schedule = await _scheduleService.CreateAsync(request);
        return Created($"api/schedules/{schedule.Id}", schedule);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<ScheduleDto>> Update(Guid id, UpdateScheduleRequest request)
    {
        var schedule = await _scheduleService.UpdateAsync(id, request);
        return Ok(schedule);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _scheduleService.DeleteAsync(id);
        return NoContent();
    }
}
