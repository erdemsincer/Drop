using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Drop.Application.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using UserEntity = Drop.Domain.Users.User;

namespace Drop.Infrastructure.Authentication;

internal sealed class JwtTokenProvider : ITokenProvider
{
    private readonly JwtOptions _options;
    private readonly TimeProvider _timeProvider;

    public JwtTokenProvider(
        IOptions<JwtOptions> options,
        TimeProvider timeProvider)
    {
        _options = options.Value;
        _timeProvider = timeProvider;
    }

    public int AccessTokenLifetimeSeconds => _options.AccessTokenMinutes * 60;

    public string Create(UserEntity user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: _timeProvider.GetUtcNow().AddMinutes(_options.AccessTokenMinutes).UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
