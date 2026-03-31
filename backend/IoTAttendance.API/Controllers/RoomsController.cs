using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly RoomService _roomService;

    public RoomsController(RoomService roomService) => _roomService = roomService;

    [HttpGet]
    public async Task<ActionResult<List<RoomDto>>> GetAll()
    {
        var rooms = await _roomService.GetAllAsync();
        return Ok(rooms);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoomDto>> GetById(Guid id)
    {
        var room = await _roomService.GetByIdAsync(id);
        return Ok(room);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<RoomDto>> Create(CreateRoomRequest request)
    {
        var room = await _roomService.CreateAsync(request);
        return Created($"api/rooms/{room.Id}", room);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<RoomDto>> Update(Guid id, UpdateRoomRequest request)
    {
        var room = await _roomService.UpdateAsync(id, request);
        return Ok(room);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _roomService.DeleteAsync(id);
        return NoContent();
    }
}
