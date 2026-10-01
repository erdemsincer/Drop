using Drop.Application.Drops.Schedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

/// <summary>Recurring drops ("every weekday at 15:00") of a branch.</summary>
[Authorize]
[ApiController]
[Tags("Drop schedules")]
public sealed class DropSchedulesController : ControllerBase
{
    [HttpGet("api/branches/{branchId:guid}/schedules")]
    public async Task<ActionResult<IReadOnlyList<DropScheduleResponse>>> List(
        Guid branchId,
        [FromServices] DropScheduleService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ListAsync(branchId, cancellationToken));
    }

    [HttpPost("api/branches/{branchId:guid}/schedules")]
    public async Task<ActionResult<DropScheduleResponse>> Create(
        Guid branchId,
        [FromBody] CreateDropScheduleRequest request,
        [FromServices] DropScheduleService service,
        CancellationToken cancellationToken)
    {
        var schedule = await service.CreateAsync(branchId, request, cancellationToken);
        return Created($"/api/schedules/{schedule.Id}", schedule);
    }

    [HttpPost("api/schedules/{scheduleId:guid}/pause")]
    public async Task<ActionResult<DropScheduleResponse>> Pause(
        Guid scheduleId,
        [FromServices] DropScheduleService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.SetPausedAsync(scheduleId, paused: true, cancellationToken));
    }

    [HttpPost("api/schedules/{scheduleId:guid}/resume")]
    public async Task<ActionResult<DropScheduleResponse>> Resume(
        Guid scheduleId,
        [FromServices] DropScheduleService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.SetPausedAsync(scheduleId, paused: false, cancellationToken));
    }

    /// <summary>Removes the schedule; its announced-but-not-started drops are cancelled.</summary>
    [HttpDelete("api/schedules/{scheduleId:guid}")]
    public async Task<IActionResult> Delete(
        Guid scheduleId,
        [FromServices] DropScheduleService service,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(scheduleId, cancellationToken);
        return NoContent();
    }
}
