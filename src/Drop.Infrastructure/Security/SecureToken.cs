using System.Security.Cryptography;
using System.Text;

namespace Drop.Infrastructure.Security;

/// <summary>High-entropy opaque tokens; only the SHA-256 hash is ever stored.</summary>
internal static class SecureToken
{
    public static string Generate(int bytes = 32) =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(bytes));

    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
