using System.Text;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RadiusController : ControllerBase
{
    private readonly RadiusService _radiusService;
    private readonly IConfiguration _config;

    public RadiusController(RadiusService radiusService, IConfiguration config)
    {
        _radiusService = radiusService;
        _config = config;
    }

    private static string? FormValue(IFormCollection form, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (form.TryGetValue(key, out var v) && !string.IsNullOrEmpty(v))
                return v.ToString();
        }

        return null;
    }

    /// <summary>
    /// RADIUS authentication endpoint.
    /// Called by the RADIUS server (FreeRADIUS) via rest module
    /// when a student connects to the Teltonika RUTX11 hotspot.
    /// </summary>
    [HttpPost("authenticate")]
    [AllowAnonymous] // RADIUS server uses shared secret
    public async Task<IActionResult> Authenticate(CancellationToken cancellationToken)
    {
        // FreeRADIUS rlm_rest often omits Content-Type; [FromForm] may not bind — read body manually.
        var (username, password) = await ReadRadiusAuthFormAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest(new { error = "Missing username." });

        var isValid = await _radiusService.ValidateCredentialsAsync(username, password ?? string.Empty);
        if (!isValid)
            return Unauthorized(new { Reply_Message = "Authentication failed." });

        // rlm_rest: some versions mishandle empty 200 or JSON — return plain text OK.
        return Content("OK", "text/plain; charset=utf-8", Encoding.UTF8);
    }

    private async Task<(string? Username, string? Password)> ReadRadiusAuthFormAsync(CancellationToken ct)
    {
        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            return (FormValue(form, "username", "User-Name"), FormValue(form, "password", "User-Password"));
        }

        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync(ct);
        Request.Body.Position = 0;
        if (string.IsNullOrWhiteSpace(body))
            return (null, null);

        var q = QueryHelpers.ParseQuery(body);
        string? g(string a, string b) =>
            q.TryGetValue(a, out var va) && !string.IsNullOrEmpty(va) ? va.ToString()
            : q.TryGetValue(b, out var vb) && !string.IsNullOrEmpty(vb) ? vb.ToString()
            : null;

        return (g("username", "User-Name"), g("password", "User-Password"));
    }

    /// <summary>
    /// RADIUS Accounting (Accounting-Request). The FreeRADIUS rest module calls this after successful auth
    /// to record the phone MAC (<c>Calling-Station-Id</c>) on the student’s devices.
    /// </summary>
    [HttpPost("accounting")]
    [AllowAnonymous]
    [Consumes("application/x-www-form-urlencoded", "multipart/form-data")]
    public async Task<IActionResult> Accounting([FromHeader(Name = "X-Api-Key")] string? apiKeyFromHeader)
    {
        var form = await Request.ReadFormAsync();
        var apiKey = apiKeyFromHeader ?? FormValue(form, "api_key", "api-key");
        var expected = _config["Router:ApiKey"];
        if (string.IsNullOrEmpty(expected) || apiKey != expected)
            return Unauthorized(new { error = "Invalid API key." });
        var userName = FormValue(form, "User-Name", "username");
        var callingStationId = FormValue(form, "Calling-Station-Id", "calling-station-id");
        var acctStatusType = FormValue(form, "Acct-Status-Type", "acct-status-type");
        var acctUnique = FormValue(form, "Acct-Unique-Session-Id", "acct-unique-session-id");
        var acctSessionTime = FormValue(form, "Acct-Session-Time", "acct-session-time");
        var framedIp = FormValue(form, "Framed-IP-Address", "framed-ip-address");

        await _radiusService.ProcessAccountingAsync(
            userName, callingStationId, acctStatusType, acctUnique, acctSessionTime, framedIp);
        return Ok();
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
