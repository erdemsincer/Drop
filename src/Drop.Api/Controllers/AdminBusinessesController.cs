using Drop.Application.Admin;
using Drop.Domain.Businesses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

/// <summary>Manual business review. Only users listed in Admin:Emails.</summary>
[Authorize]
[ApiController]
[Route("api/admin/businesses")]
[Tags("Admin")]
public sealed class AdminBusinessesController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminBusinessResponse>>> GetAll(
        [FromQuery] BusinessStatus? status,
        [FromServices] AdminBusinessesService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ListAsync(status, cancellationToken));
    }

    [HttpPost("{businessId:guid}/approve")]
    public async Task<ActionResult<AdminBusinessResponse>> Approve(
        Guid businessId,
        [FromServices] AdminBusinessesService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ApproveAsync(businessId, cancellationToken));
    }

    [HttpPost("{businessId:guid}/reject")]
    public async Task<ActionResult<AdminBusinessResponse>> Reject(
        Guid businessId,
        [FromBody] ModerationReasonRequest request,
        [FromServices] AdminBusinessesService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.RejectAsync(businessId, request, cancellationToken));
    }

    /// <summary>Blocks an approved business and withdraws its live and scheduled drops.</summary>
    [HttpPost("{businessId:guid}/suspend")]
    public async Task<ActionResult<AdminBusinessResponse>> Suspend(
        Guid businessId,
        [FromBody] ModerationReasonRequest request,
        [FromServices] AdminBusinessesService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.SuspendAsync(businessId, request, cancellationToken));
    }
}
