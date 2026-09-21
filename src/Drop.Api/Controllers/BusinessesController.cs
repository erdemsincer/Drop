using Drop.Application.Businesses.CreateBusiness;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/businesses")]
[Tags("Businesses")]
public sealed class BusinessesController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateBusinessResponse>> Create(
        [FromBody] CreateBusinessRequest request,
        [FromServices] CreateBusinessService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(request, cancellationToken);

        return Created($"/api/businesses/{response.Id}", response);
    }
}
