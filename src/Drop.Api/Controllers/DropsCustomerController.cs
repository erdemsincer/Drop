using Drop.Application.Drops.GetNearbyDrops;
using Drop.Application.Drops.GetUpcomingDrops;
using Drop.Application.Features.Drops.GetDropDetail;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[ApiController]
[Route("api/drops")]
[Tags("Drops")]
public sealed class DropsCustomerController : ControllerBase
{
    [HttpGet("nearby")]
    public async Task<ActionResult<IReadOnlyList<NearbyDropResponse>>> GetNearby(
        [FromQuery] GetNearbyDropsRequest request,
        [FromServices] GetNearbyDropsService service,
        CancellationToken cancellationToken)
    {
        // Binding the request object lets ValidationActionFilter run
        // GetNearbyDropsRequestValidator, so bad input is a 400, not a 500.
        var response = await service.ExecuteAsync(
            request.Latitude,
            request.Longitude,
            request.RadiusKm,
            request.Category,
            cancellationToken);

        return Ok(response);
    }

    /// <summary>Scheduled drops nearby, starting within a week, soonest first.</summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<IReadOnlyList<UpcomingDropResponse>>> GetUpcoming(
        [FromQuery] GetNearbyDropsRequest request,
        [FromServices] GetUpcomingDropsService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(request.Latitude, request.Longitude, request.RadiusKm, cancellationToken));
    }

    [HttpGet("{dropId:guid}")]
    public async Task<ActionResult<DropDetailResponse>> GetDetail(
        Guid dropId,
        [FromServices] GetDropDetailService service,
        CancellationToken cancellationToken)
    {
        var result = await service.ExecuteAsync(
            dropId,
            cancellationToken);

        return Ok(result);
    }
}
