using Drop.Application.Users.Badges;
using Drop.Application.Users.Stats;
using Drop.Api.Configuration;
using Drop.Application.Authentication.Login;
using Drop.Application.Follows;
using Drop.Application.Notifications.Push;
using Drop.Application.Users.ChangePassword;
using Drop.Application.Users.DeleteAccount;
using Drop.Application.Users.EmailVerification;
using Drop.Application.Users.Me;
using Drop.Application.Users.UpdateProfile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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

    /// <summary>Totals for the profile: drops caught, used, and money saved.</summary>
    [HttpGet("me/stats")]
    public async Task<ActionResult<MyStatsResponse>> GetMyStats(
        [FromServices] GetMyStatsService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(cancellationToken));
    }

    /// <summary>Achievements and progress towards each.</summary>
    [HttpGet("me/badges")]
    public async Task<ActionResult<IReadOnlyList<BadgeResponse>>> GetMyBadges(
        [FromServices] BadgeService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(cancellationToken));
    }

    [HttpPut("me")]
    public async Task<ActionResult<MeResponse>> UpdateMe(
        [FromBody] UpdateProfileRequest request,
        [FromServices] UpdateProfileService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(request, cancellationToken));
    }

    /// <summary>
    /// Changes the password after re-checking the current one. Every other
    /// session is signed out; the response is a fresh token pair for this one.
    /// </summary>
    [HttpPost("me/password")]
    [EnableRateLimiting(RateLimitingSetup.AuthPolicy)]
    public async Task<ActionResult<LoginResponse>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] ChangePasswordService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ExecuteAsync(request, cancellationToken));
    }

    /// <summary>Confirms the e-mail address with the 6-digit code sent at sign-up.</summary>
    [HttpPost("me/email/verify")]
    [EnableRateLimiting(RateLimitingSetup.AuthPolicy)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailRequest request,
        [FromServices] EmailVerificationService service,
        CancellationToken cancellationToken)
    {
        await service.VerifyAsync(request, cancellationToken);

        return NoContent();
    }

    /// <summary>Sends a new verification code (at most one per minute). Always 202.</summary>
    [HttpPost("me/email/resend")]
    [EnableRateLimiting(RateLimitingSetup.AuthPolicy)]
    public async Task<IActionResult> ResendVerification(
        [FromServices] EmailVerificationService service,
        CancellationToken cancellationToken)
    {
        await service.ResendAsync(cancellationToken);

        return Accepted();
    }

    /// <summary>Businesses the user follows, most recent first.</summary>
    [HttpGet("me/follows")]
    public async Task<ActionResult<IReadOnlyList<FollowedBusinessResponse>>> GetFollows(
        [FromServices] FollowService service,
        CancellationToken cancellationToken)
    {
        return Ok(await service.ListMineAsync(cancellationToken));
    }

    /// <summary>Registers this device's Expo push token for the signed-in user.</summary>
    [HttpPut("me/push-token")]
    public async Task<IActionResult> RegisterPushToken(
        [FromBody] RegisterDeviceTokenRequest request,
        [FromServices] DeviceTokenService service,
        CancellationToken cancellationToken)
    {
        await service.RegisterAsync(request, cancellationToken);
        return NoContent();
    }

    /// <summary>Stops pushes to this device (called on sign-out).</summary>
    [HttpPost("me/push-token/remove")]
    public async Task<IActionResult> RemovePushToken(
        [FromBody] RegisterDeviceTokenRequest request,
        [FromServices] DeviceTokenService service,
        CancellationToken cancellationToken)
    {
        await service.UnregisterAsync(request.Token, cancellationToken);
        return NoContent();
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
