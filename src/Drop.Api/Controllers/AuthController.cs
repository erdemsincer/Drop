using Drop.Application.Authentication.External;
using Drop.Application.Authentication.Login;
using Drop.Application.Authentication.Logout;
using Drop.Application.Authentication.PasswordReset;
using Drop.Application.Authentication.Refresh;
using Drop.Application.Authentication.Register;
using Drop.Api.Configuration;
using Drop.Domain.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Drop.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting(RateLimitingSetup.AuthPolicy)]
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

    /// <summary>
    /// Signs in with an Apple identity token: an existing linked account, an
    /// account with the same e-mail (then linked), or a brand-new one.
    /// </summary>
    [HttpPost("apple")]
    public async Task<ActionResult<LoginResponse>> SignInWithApple(
        [FromBody] ExternalSignInRequest request,
        [FromServices] ExternalSignInService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(ExternalProvider.Apple, request, cancellationToken));
    }

    /// <summary>Signs in with a Google ID token; same rules as Apple.</summary>
    [HttpPost("google")]
    public async Task<ActionResult<LoginResponse>> SignInWithGoogle(
        [FromBody] ExternalSignInRequest request,
        [FromServices] ExternalSignInService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(ExternalProvider.Google, request, cancellationToken));
    }

    /// <summary>Exchanges a refresh token for a new token pair (the old refresh token is revoked).</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh(
        [FromBody] RefreshTokenRequest request,
        [FromServices] RefreshSessionService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(request, cancellationToken));
    }

    /// <summary>Revokes the refresh token. Works with an expired access token.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest request,
        [FromServices] LogoutService service,
        CancellationToken cancellationToken)
    {
        await service.ExecuteAsync(request, cancellationToken);

        return NoContent();
    }

    /// <summary>E-mails a 6-digit reset code. Always 202, whether or not the account exists.</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] PasswordResetService service,
        CancellationToken cancellationToken)
    {
        await service.RequestAsync(request, cancellationToken);

        return Accepted();
    }

    /// <summary>Sets a new password with the e-mailed code and signs out every session.</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        [FromServices] PasswordResetService service,
        CancellationToken cancellationToken)
    {
        await service.ResetAsync(request, cancellationToken);

        return NoContent();
    }
}
