namespace Drop.Application.Authentication;

public interface ICurrentUser
{
    Guid Id { get; }

    bool IsAuthenticated { get; }
}
