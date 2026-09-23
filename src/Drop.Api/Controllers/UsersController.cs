using Drop.Application.Users.Me;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
[Tags("Users")]
public sealed class UsersController : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<MeResponse>> GetMe(
        [FromServices] GetMeService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(cancellationToken));
    }
}
