using Microsoft.AspNetCore.Mvc.ModelBinding;
using Drop.Application.Authentication;
using Drop.Application.Claims.CancelClaim;
using Drop.Application.Claims.RateClaim;
using Drop.Application.Claims.CreateClaim;
using Drop.Application.Claims.MyClaims;
using Drop.Application.Features.Claims.ActiveClaim;
using Drop.Application.Claims.RedeemClaim;
using Microsoft.AspNetCore.Authorization;
using Drop.Api.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/claims")]
[Tags("Claims")]
public sealed class ClaimsController : ControllerBase
{
    /// <summary>The current user's claims, newest first (max 50).</summary>
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<MyClaimResponse>>> GetMine(
        [FromServices] GetMyClaimsService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(cancellationToken));
    }

    [HttpGet("me/active")]
    public async Task<ActionResult> GetActive(
        [FromServices] GetActiveClaimService service,
        CancellationToken cancellationToken)
    {
        var result = await service.ExecuteAsync(cancellationToken);

        if (result is null)
            return NoContent();

        return Ok(result);
    }

    [HttpPost("{claimId:guid}/redeem")]
    [EnableRateLimiting(RateLimitingSetup.RedeemPolicy)]
    public async Task<ActionResult<RedeemClaimResponse>> Redeem(
        Guid claimId,
        [FromBody] RedeemClaimRequest request,
        [FromServices] RedeemClaimService service,
        [FromServices] ICurrentUser currentUser,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(
            claimId,
            currentUser.Id,
            request,
            cancellationToken);

        return Ok(response);
    }

    /// <summary>Gives an unused reservation back. The same drop can't be claimed again.</summary>
    /// <summary>Rates a used drop with 1–5 stars; rating again replaces the stars.</summary>
    [HttpPost("{claimId:guid}/rating")]
    public async Task<IActionResult> Rate(
        Guid claimId,
        [FromBody] RateClaimRequest request,
        [FromServices] RateClaimService service,
        CancellationToken cancellationToken)
    {
        await service.ExecuteAsync(claimId, request, cancellationToken);

        return NoContent();
    }

    [HttpPost("{claimId:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid claimId,
        [FromServices] CancelClaimService service,
        CancellationToken cancellationToken)
    {
        await service.ExecuteAsync(claimId, cancellationToken);

        return NoContent();
    }
}

[Authorize]
[ApiController]
[Route("api/drops/{dropId:guid}/claims")]
[Tags("Claims")]
public sealed class DropClaimsController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateClaimResponse>> Create(
        Guid dropId,
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] CreateClaimRequest? request,
        [FromServices] CreateClaimService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(dropId, request, cancellationToken);

        return Created($"/api/claims/{response.ClaimId}", response);
    }
}
