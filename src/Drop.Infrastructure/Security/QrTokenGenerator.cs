using Drop.Application.Security;

namespace Drop.Infrastructure.Security;

internal sealed class QrTokenGenerator : IQrTokenGenerator
{
    public string Generate() => SecureToken.Generate();

    public string Hash(string token) => SecureToken.Hash(token);
}
