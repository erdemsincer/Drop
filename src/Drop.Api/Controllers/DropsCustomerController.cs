using Drop.Application.Drops.GetNearbyDrops;
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
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radiusKm,
        [FromServices] GetNearbyDropsService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(
            latitude,
            longitude,
            radiusKm,
            cancellationToken);

        return Ok(response);
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
