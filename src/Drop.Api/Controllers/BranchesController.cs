using Drop.Application.Branches.CreateBranch;
using Drop.Application.Branches.GetBranch;
using Drop.Application.Branches.GetBranchQr;
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
