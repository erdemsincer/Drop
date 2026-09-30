using Drop.Application.Businesses.CreateBusiness;
using Drop.Application.Businesses.GetMyBusinesses;
using Drop.Application.Businesses.RenameBusiness;
using Drop.Application.Businesses.Stats;
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

    /// <summary>Reservations, redemptions and customers over the last N days (1–90, default 30).</summary>
    [HttpGet("{businessId:guid}/stats")]
    public async Task<ActionResult<BusinessStatsResponse>> Stats(
        Guid businessId,
        [FromServices] BusinessStatsService service,
        CancellationToken cancellationToken,
        [FromQuery] int days = 30)
    {
        return Ok(await service.ExecuteAsync(businessId, days, cancellationToken));
    }
}
