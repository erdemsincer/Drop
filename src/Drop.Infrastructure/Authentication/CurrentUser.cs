using System.Security.Claims;
using Drop.Application.Authentication;
using Microsoft.AspNetCore.Http;

namespace Drop.Infrastructure.Authentication;

internal sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true;

    public Guid Id
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(value, out var id)
                ? id
                : throw new UnauthorizedAccessException();
        }
    }
}
