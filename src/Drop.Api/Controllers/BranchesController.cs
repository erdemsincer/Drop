using Drop.Application.Branches.BranchLifecycle;
using Drop.Application.Branches.CreateBranch;
using Drop.Application.Branches.GetBranch;
using Drop.Application.Branches.GetBranchQr;
using Drop.Application.Branches.UpdateBranch;
using Drop.Application.Branches.GetBranches;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/businesses/{businessId:guid}/branches")]
[Tags("Branches")]
public sealed class BranchesController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BranchListItemResponse>>> GetAll(
        Guid businessId,
        [FromServices] GetBranchesService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(businessId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<CreateBranchResponse>> Create(
        Guid businessId,
        [FromBody] CreateBranchRequest request,
        [FromServices] CreateBranchService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(businessId, request, cancellationToken);

        return Created($"/api/branches/{response.Id}", response);
    }
}

[Authorize]
[ApiController]
[Route("api/branches/{branchId:guid}")]
[Tags("Branches")]
public sealed class BranchDetailController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<BranchDetailResponse>> Get(
        Guid branchId,
        [FromServices] GetBranchService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(branchId, cancellationToken));
    }

    /// <summary>Renames the branch and optionally moves it.</summary>
    [HttpPut]
    public async Task<ActionResult<CreateBranchResponse>> Update(
        Guid branchId,
        [FromBody] UpdateBranchRequest request,
        [FromServices] UpdateBranchService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(branchId, request, cancellationToken));
    }

    /// <summary>
    /// Closes the branch: its live and scheduled drops (and their unused
    /// reservations) are cancelled and it can't publish until reopened.
    /// </summary>
    [HttpPost("close")]
    public async Task<IActionResult> Close(
        Guid branchId,
        [FromServices] BranchLifecycleService service,
        CancellationToken cancellationToken)
    {
        await service.CloseAsync(branchId, cancellationToken);

        return NoContent();
    }

    [HttpPost("reopen")]
    public async Task<IActionResult> Reopen(
        Guid branchId,
        [FromServices] BranchLifecycleService service,
        CancellationToken cancellationToken)
    {
        await service.ReopenAsync(branchId, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// The branch's current rotating QR code. Poll again at refreshAt;
    /// each code is accepted for roughly a minute.
    /// </summary>
    [HttpGet("qr")]
    public async Task<ActionResult<BranchQrResponse>> GetQr(
        Guid branchId,
        [FromServices] GetBranchQrService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(branchId, cancellationToken));
    }
}
