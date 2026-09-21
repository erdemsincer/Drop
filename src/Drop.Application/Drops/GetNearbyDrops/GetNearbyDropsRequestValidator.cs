using FluentValidation;

namespace Drop.Application.Drops.GetNearbyDrops;

public sealed class GetNearbyDropsRequestValidator
    : AbstractValidator<GetNearbyDropsRequest>
{
    public GetNearbyDropsRequestValidator()
    {
        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithErrorCode("latitude.out_of_range");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithErrorCode("longitude.out_of_range");

        RuleFor(x => x.RadiusKm)
            .GreaterThan(0)
            .WithErrorCode("radius.invalid")
            .LessThanOrEqualTo(20)
            .WithErrorCode("radius.too_large");
    }
}
