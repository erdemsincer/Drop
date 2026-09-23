using Drop.Application.Drops.ManageDrop;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/drops/{dropId:guid}")]
[Tags("Drops")]
public sealed class DropManagementController : ControllerBase
{
    /// <summary>Stops new claims now; customers who already claimed can still redeem.</summary>
    [HttpPost("end")]
    public async Task<ActionResult<DropLifecycleResponse>> End(
        Guid dropId,
        [FromServices] ManageDropService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.EndAsync(dropId, cancellationToken));
    }

    /// <summary>Withdraws the drop and invalidates its unused reservations.</summary>
    [HttpPost("cancel")]
    public async Task<ActionResult<DropLifecycleResponse>> Cancel(
        Guid dropId,
        [FromServices] ManageDropService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.CancelAsync(dropId, cancellationToken));
    }
}
