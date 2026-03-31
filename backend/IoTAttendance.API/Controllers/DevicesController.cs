using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DevicesController : ControllerBase
{
    private readonly StudentDeviceService _deviceService;

    public DevicesController(StudentDeviceService deviceService) => _deviceService = deviceService;

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<List<StudentDeviceDto>>> GetAll()
    {
        var devices = await _deviceService.GetAllAsync();
        return Ok(devices);
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<List<StudentDeviceDto>>> GetByStudent(Guid studentId)
    {
        var devices = await _deviceService.GetByStudentAsync(studentId);
        return Ok(devices);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Student")]
    public async Task<ActionResult<StudentDeviceDto>> Register(RegisterDeviceRequest request)
    {
        var device = await _deviceService.RegisterAsync(request);
        return Created($"api/devices/{device.Id}", device);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<StudentDeviceDto>> Update(Guid id, UpdateDeviceRequest request)
    {
        var device = await _deviceService.UpdateAsync(id, request);
        return Ok(device);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _deviceService.DeleteAsync(id);
        return NoContent();
    }
}
