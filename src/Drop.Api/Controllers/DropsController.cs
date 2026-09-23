using Drop.Application.Drops.CreateDrop;
using Drop.Application.Drops.GetBranchDrops;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/branches/{branchId:guid}/drops")]
[Tags("Drops")]
public sealed class DropsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BusinessDropResponse>>> GetAll(
        Guid branchId,
        [FromServices] GetBranchDropsService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(branchId, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<CreateDropResponse>> Create(
        Guid branchId,
        [FromBody] CreateDropRequest request,
        [FromServices] CreateDropService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(
            branchId,
            request,
            cancellationToken);

        return Created(
            $"/api/drops/{response.Id}",
            response);
    }
}
