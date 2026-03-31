using IoTAttendance.API.DTOs;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IoTAttendance.API.Controllers;

[ApiController]
[Route("api/iot-nodes")]
[Authorize]
public class IoTNodesController : ControllerBase
{
    private readonly IoTNodeService _nodeService;
    private readonly RouterPollingService _routerService;
    private readonly IConfiguration _config;

    public IoTNodesController(
        IoTNodeService nodeService,
        RouterPollingService routerService,
        IConfiguration config)
    {
        _nodeService = nodeService;
        _routerService = routerService;
        _config = config;
    }

    [HttpGet]
    public async Task<ActionResult<List<IoTNodeDto>>> GetAll()
    {
        var nodes = await _nodeService.GetAllAsync();
        return Ok(nodes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IoTNodeDto>> GetById(Guid id)
    {
        var node = await _nodeService.GetByIdAsync(id);
        return Ok(node);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<IoTNodeDto>> Create(CreateIoTNodeRequest request)
    {
        var node = await _nodeService.CreateAsync(request);
        return Created($"api/iot-nodes/{node.Id}", node);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<IoTNodeDto>> Update(Guid id, UpdateIoTNodeRequest request)
    {
        var node = await _nodeService.UpdateAsync(id, request);
        return Ok(node);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _nodeService.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Receive station dump data from a router's cron script.
    /// This endpoint is called by the Teltonika RUTX11 router.
    /// </summary>
    [HttpPost("station-dump")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveStationDump(
        RouterStationDumpRequest request,
        [FromHeader(Name = "X-Api-Key")] string apiKey)
    {
        var configuredKey = _config["Router:ApiKey"];
        if (string.IsNullOrEmpty(apiKey) || apiKey != configuredKey)
            return Unauthorized(new { error = "Invalid API key." });

        await _routerService.ProcessStationDumpAsync(request);
        return Ok();
    }

    [HttpGet("{id}/status")]
    public async Task<ActionResult<RouterStatusDto>> GetRouterStatus(Guid id)
    {
        var status = await _routerService.GetRouterStatusAsync(id);
        return Ok(status);
    }
}
