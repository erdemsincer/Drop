using Drop.Domain.Users;

namespace Drop.Application.Authentication;

public interface ITokenProvider
{
    string Create(User user);
}
