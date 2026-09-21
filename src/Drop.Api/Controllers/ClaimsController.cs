using Drop.Application.Claims.CreateClaim;
using Drop.Application.Claims.RedeemClaim;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/drops/{dropId:guid}/claims")]
[Tags("Claims")]
public sealed class ClaimsController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateClaimResponse>> Create(
        Guid dropId,
        [FromServices] CreateClaimService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(dropId, cancellationToken);

        return Created($"/api/claims/{response.ClaimId}", response);
    }
}

[Authorize]
[ApiController]
[Route("api/claims/{claimId:guid}")]
public sealed class ClaimRedemptionController : ControllerBase
{
    [HttpPost("redeem")]
    public async Task<ActionResult<RedeemClaimResponse>> Redeem(
        Guid claimId,
        [FromBody] RedeemClaimRequest request,
        [FromServices] RedeemClaimService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(claimId, request, cancellationToken);

        return Ok(response);
    }
}

