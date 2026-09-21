using System.Security.Cryptography;
using System.Text;
using Drop.Application.Security;

namespace Drop.Infrastructure.Security;

internal sealed class QrTokenGenerator : IQrTokenGenerator
{
    public string Generate()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);

        return Convert.ToHexString(bytes);
    }

    public string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));

        return Convert.ToHexString(bytes);
    }
}
