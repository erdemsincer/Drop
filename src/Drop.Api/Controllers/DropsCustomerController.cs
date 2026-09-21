using Drop.Application.Drops.GetNearbyDrops;
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
}
