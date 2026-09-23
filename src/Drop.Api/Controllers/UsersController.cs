using Drop.Application.Users.DeleteAccount;
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

    /// <summary>
    /// Permanently deletes the account after re-checking the password.
    /// Businesses the user owns are deleted with it.
    /// </summary>
    [HttpPost("me/delete")]
    public async Task<IActionResult> DeleteMe(
        [FromBody] DeleteAccountRequest request,
        [FromServices] DeleteAccountService service,
        CancellationToken cancellationToken)
    {
        await service.ExecuteAsync(request, cancellationToken);

        return NoContent();
    }
}
