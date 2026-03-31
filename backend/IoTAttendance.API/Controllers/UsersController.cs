using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService) => _userService = userService;

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<List<UserDto>>> GetAll(
        [FromQuery] string? role = null,
        [FromQuery] string? search = null)
    {
        var users = await _userService.GetAllAsync(role, search);
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _userService.GetByIdAsync(id);
        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request)
    {
        var user = await _userService.CreateAsync(request);
        return Created($"api/users/{user.Id}", user);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUserRequest request)
    {
        var user = await _userService.UpdateAsync(id, request);
        return Ok(user);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _userService.DeleteAsync(id);
        return NoContent();
    }
}
