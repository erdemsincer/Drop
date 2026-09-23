using Drop.Domain.Users;

namespace Drop.Application.Authentication;

public interface ITokenProvider
{
    string Create(User user);

    /// <summary>Access token lifetime in seconds.</summary>
    int AccessTokenLifetimeSeconds { get; }
}
