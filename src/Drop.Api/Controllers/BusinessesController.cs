using Drop.Application.Businesses.Profile;
using Drop.Application.Businesses.CreateBusiness;
using Drop.Application.Businesses.GetMyBusinesses;
using Drop.Application.Businesses.RenameBusiness;
using Drop.Application.Businesses.Stats;
using Drop.Application.Follows;
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
    /// <summary>The customer-facing page of an approved business.</summary>
    [HttpGet("{businessId:guid}/profile")]
    public async Task<ActionResult<BusinessProfileResponse>> GetProfile(
        Guid businessId,
        [FromServices] GetBusinessProfileService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(businessId, cancellationToken));
    }

    [HttpGet("{businessId:guid}/stats")]
    public async Task<ActionResult<BusinessStatsResponse>> Stats(
        Guid businessId,
        [FromServices] BusinessStatsService service,
        CancellationToken cancellationToken,
        [FromQuery] int days = 30)
    {
        return Ok(await service.ExecuteAsync(businessId, days, cancellationToken));
    }

    /// <summary>Follow to get a push when this business publishes a drop. Idempotent.</summary>
    [HttpPost("{businessId:guid}/follow")]
    public async Task<IActionResult> Follow(
        Guid businessId,
        [FromServices] FollowService service,
        CancellationToken cancellationToken)
    {
        await service.FollowAsync(businessId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{businessId:guid}/follow")]
    public async Task<IActionResult> Unfollow(
        Guid businessId,
        [FromServices] FollowService service,
        CancellationToken cancellationToken)
    {
        await service.UnfollowAsync(businessId, cancellationToken);
        return NoContent();
    }
}
