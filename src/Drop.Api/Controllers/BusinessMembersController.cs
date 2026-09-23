using Drop.Application.Businesses.Members;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/businesses/{businessId:guid}/members")]
[Tags("Business members")]
public sealed class BusinessMembersController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MemberResponse>>> GetAll(
        Guid businessId,
        [FromServices] BusinessMembersService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ListAsync(businessId, cancellationToken));
    }

    /// <summary>Adds an existing Drop user (by e-mail) as Manager or Staff.</summary>
    [HttpPost]
    public async Task<ActionResult<MemberResponse>> Add(
        Guid businessId,
        [FromBody] AddMemberRequest request,
        [FromServices] BusinessMembersService service,
        CancellationToken cancellationToken)
    {
        var member = await service.AddAsync(businessId, request, cancellationToken);

        return Created($"/api/businesses/{businessId}/members/{member.UserId}", member);
    }

    /// <summary>Removes a member; members may also remove themselves (leave).</summary>
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Remove(
        Guid businessId,
        Guid userId,
        [FromServices] BusinessMembersService service,
        CancellationToken cancellationToken)
    {
        await service.RemoveAsync(businessId, userId, cancellationToken);

        return NoContent();
    }
}
