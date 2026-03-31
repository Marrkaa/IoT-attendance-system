using System.Security.Claims;
using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly AttendanceService _attendanceService;
    private readonly RouterPollingService _routerService;
    private readonly SignalProcessingService _signalService;

    public AttendanceController(
        AttendanceService attendanceService,
        RouterPollingService routerService,
        SignalProcessingService signalService)
    {
        _attendanceService = attendanceService;
        _routerService = routerService;
        _signalService = signalService;
    }

    [HttpGet("lecture/{lectureId}")]
    [Authorize(Roles = "Lecturer,Administrator")]
    public async Task<ActionResult<List<AttendanceRecordDto>>> GetByLecture(
        Guid lectureId, [FromQuery] string? date = null)
    {
        var records = await _attendanceService.GetByLectureAsync(lectureId, date);
        return Ok(records);
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<List<AttendanceRecordDto>>> GetByStudent(
        Guid studentId, [FromQuery] Guid? lectureId = null)
    {
        var records = await _attendanceService.GetByStudentAsync(studentId, lectureId);
        return Ok(records);
    }

    [HttpGet("stats/{studentId}")]
    public async Task<ActionResult<AttendanceStatsDto>> GetStats(
        Guid studentId, [FromQuery] Guid? lectureId = null)
    {
        var stats = await _attendanceService.GetStatsAsync(studentId, lectureId);
        return Ok(stats);
    }

    [HttpPost("manual")]
    [Authorize(Roles = "Lecturer,Administrator")]
    public async Task<ActionResult<AttendanceRecordDto>> ManualMark(ManualAttendanceRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var record = await _attendanceService.ManualMarkAsync(request, userId);
        return Created("", record);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Lecturer,Administrator")]
    public async Task<ActionResult<AttendanceRecordDto>> UpdateStatus(
        Guid id, UpdateAttendanceRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var record = await _attendanceService.UpdateStatusAsync(id, request, userId);
        return Ok(record);
    }

    [HttpGet("live/{lectureId}")]
    [Authorize(Roles = "Lecturer,Administrator")]
    public async Task<ActionResult<List<LiveAttendanceDto>>> GetLiveAttendance(Guid lectureId)
    {
        var data = await _routerService.GetLiveAttendanceAsync(lectureId);
        return Ok(data);
    }

    [HttpGet("summary/{lectureId}")]
    [Authorize(Roles = "Lecturer,Administrator")]
    public async Task<ActionResult<List<DailyAttendanceSummaryDto>>> GetDailySummary(
        Guid lectureId,
        [FromQuery] string startDate,
        [FromQuery] string endDate)
    {
        var summary = await _attendanceService.GetDailySummaryAsync(lectureId, startDate, endDate);
        return Ok(summary);
    }

    [HttpPost("finalize/{scheduleId}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> FinalizeAttendance(
        Guid scheduleId, [FromQuery] string date)
    {
        await _signalService.FinalizeAttendanceAsync(scheduleId, DateOnly.Parse(date));
        return Ok();
    }
}
