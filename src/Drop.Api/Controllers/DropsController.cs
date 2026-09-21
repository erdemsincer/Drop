using Drop.Application.Drops.CreateDrop;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[ApiController]
[Route("api/branches/{branchId:guid}/drops")]
[Tags("Drops")]
public sealed class DropsController : ControllerBase
{
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
