namespace Drop.Application.Businesses.CreateBusiness;

public sealed record CreateBusinessResponse(
    Guid Id,
    string Name,
    Domain.Businesses.BusinessStatus Status);
