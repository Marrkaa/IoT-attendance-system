using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RadiusController : ControllerBase
{
    private readonly RadiusService _radiusService;

    public RadiusController(RadiusService radiusService) => _radiusService = radiusService;

    /// <summary>
    /// RADIUS authentication endpoint.
    /// Called by the RADIUS server (FreeRADIUS) via rest module
    /// when a student connects to the Teltonika RUTX11 hotspot.
    /// </summary>
    [HttpPost("authenticate")]
    [AllowAnonymous] // RADIUS server uses shared secret
    public async Task<IActionResult> Authenticate(
        [FromForm] string username,
        [FromForm] string password)
    {
        var isValid = await _radiusService.ValidateCredentialsAsync(username, password);
        if (!isValid)
            return Unauthorized(new { Reply_Message = "Autentifikacija nepavyko." });

        return Ok(new
        {
            Reply_Message = "Autentifikacija sėkminga."
        });
    }

    [HttpGet("account/{userId}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetAccount(Guid userId)
    {
        var account = await _radiusService.GetByUserIdAsync(userId);
        if (account == null) return NotFound();

        return Ok(new
        {
            account.Id,
            account.UserId,
            account.RadiusUsername,
            account.IsEnabled,
            account.CreatedAt
        });
    }

    [HttpPut("account/{userId}/toggle")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> ToggleAccount(Guid userId, [FromQuery] bool enabled)
    {
        await _radiusService.SetEnabledAsync(userId, enabled);
        return NoContent();
    }
}
