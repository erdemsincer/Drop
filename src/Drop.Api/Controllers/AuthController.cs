using Drop.Application.Authentication.Login;
using Drop.Application.Authentication.Register;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Tags("Auth")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request,
        [FromServices] RegisterService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(request, cancellationToken);

        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        [FromServices] LoginService service,
        CancellationToken cancellationToken)
    {
        var response = await service.ExecuteAsync(request, cancellationToken);

        return Ok(response);
    }
}
