namespace Drop.Application.Claims.CreateClaim;

/// <summary>
/// Where the customer is while catching. Optional for ordinary drops; a
/// mystery drop can only be caught from within its unlock radius.
/// </summary>
public sealed record CreateClaimRequest(double? Latitude, double? Longitude);
