using Drop.Application.Businesses.CreateBusiness;
using Drop.Application.Businesses.GetMyBusinesses;
using Drop.Application.Businesses.RenameBusiness;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/businesses")]
[Tags("Businesses")]
public sealed class BusinessesController : ControllerBase
{
    /// <summary>Businesses the current user is a member of. Empty when the user has none.</summary>
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<MyBusinessResponse>>> GetMine(
        [FromServices] GetMyBusinessesService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<CreateBusinessResponse>> Create(
        [FromBody] CreateBusinessRequest request,
        [FromServices] CreateBusinessService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(request, cancellationToken);

        return Created($"/api/businesses/{response.Id}", response);
    }

    /// <summary>Renames the business (owner only).</summary>
    [HttpPut("{businessId:guid}")]
    public async Task<ActionResult<RenameBusinessResponse>> Rename(
        Guid businessId,
        [FromBody] RenameBusinessRequest request,
        [FromServices] RenameBusinessService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(businessId, request, cancellationToken));
    }
}
