using Drop.Application.Branches.CreateBranch;
using Drop.Application.Branches.GetBranch;
using Drop.Application.Branches.GetBranches;
using Drop.Application.BranchQrTokens.Create;
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
[Route("api/branches/{branchId:guid}/qr-token")]
[Tags("Branches")]
public sealed class BranchQrTokensController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateBranchQrTokenResponse>> Create(
        Guid branchId,
        [FromServices] CreateBranchQrTokenService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(branchId, cancellationToken);

        return Ok(response);
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
}
