namespace Drop.Application.Security;

/// <param name="Payload">What the QR encodes. A short-lived secret: never log it.</param>
/// <param name="RefreshAt">When the displaying device should fetch the next code.</param>
public sealed record BranchQrCode(
    string Payload,
    DateTimeOffset RefreshAt,
    int PeriodSeconds);

/// <summary>
/// Rotating, signed branch QR codes. A code is bound to one branch and one short
/// time step, so a photographed code stops working within about a minute.
/// </summary>
public interface IBranchQrCodeService
{
    BranchQrCode Generate(Guid branchId, DateTimeOffset now);

    bool Verify(string payload, Guid expectedBranchId, DateTimeOffset now);
}
