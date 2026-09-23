namespace Drop.Application.Branches.GetBranchQr;

public sealed record BranchQrResponse(
    string Payload,
    DateTimeOffset RefreshAt,
    int PeriodSeconds);
