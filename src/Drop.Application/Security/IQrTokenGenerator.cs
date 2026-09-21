namespace Drop.Application.Security;

public interface IQrTokenGenerator
{
    string Generate();

    string Hash(string token);
}
