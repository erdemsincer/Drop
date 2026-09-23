namespace Drop.Application.Features.Claims.ActiveClaim;

public sealed record ActiveClaimResponse(
    Guid ClaimId,
    Guid DropId,
    string BusinessName,
    string BranchName,
    string DropTitle,
    DateTimeOffset ExpiresAt,
    double Latitude,
    double Longitude);