using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Drop.Application.Security;
using Microsoft.Extensions.Options;

namespace Drop.Infrastructure.Security;

/// <summary>
/// Payload: DROP1.{branchId:N}.{step}.{signature}
/// signature = base64url(HMAC-SHA256(key, "{branchId:N}.{step}")).
/// Computed on the server; the key never reaches a device.
/// </summary>
internal sealed class BranchQrCodeService : IBranchQrCodeService
{
    private const string Prefix = "DROP1";

    private readonly byte[] _key;
    private readonly int _periodSeconds;
    private readonly int _acceptedPastSteps;

    public BranchQrCodeService(IOptions<BranchQrCodeOptions> options)
    {
        var value = options.Value;

        if (string.IsNullOrWhiteSpace(value.SigningKey) || value.SigningKey.Length < 32)
        {
            throw new InvalidOperationException("Qr:SigningKey must be configured with at least 32 characters.");
        }

        _key = Encoding.UTF8.GetBytes(value.SigningKey);
        _periodSeconds = Math.Max(10, value.PeriodSeconds);
        _acceptedPastSteps = Math.Max(0, value.AcceptedPastSteps);
    }

    public BranchQrCode Generate(Guid branchId, DateTimeOffset now)
    {
        var step = StepOf(now);
        var payload = $"{Prefix}.{branchId:N}.{step}.{Sign(branchId, step)}";
        var refreshAt = DateTimeOffset.FromUnixTimeSeconds((step + 1) * _periodSeconds);

        return new BranchQrCode(payload, refreshAt, _periodSeconds);
    }

    public bool Verify(string payload, Guid expectedBranchId, DateTimeOffset now)
    {
        var parts = payload.Trim().Split('.');

        if (parts.Length != 4 ||
            parts[0] != Prefix ||
            !Guid.TryParseExact(parts[1], "N", out var branchId) ||
            !long.TryParse(parts[2], NumberStyles.None, CultureInfo.InvariantCulture, out var step))
        {
            return false;
        }

        if (branchId != expectedBranchId)
        {
            return false;
        }

        var age = StepOf(now) - step;

        if (age < 0 || age > _acceptedPastSteps)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(parts[3]),
            Encoding.ASCII.GetBytes(Sign(branchId, step)));
    }

    private long StepOf(DateTimeOffset now) => now.ToUnixTimeSeconds() / _periodSeconds;

    private string Sign(Guid branchId, long step)
    {
        var mac = HMACSHA256.HashData(_key, Encoding.ASCII.GetBytes($"{branchId:N}.{step}"));

        return Convert.ToBase64String(mac)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
