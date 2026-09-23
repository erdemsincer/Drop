using FluentValidation;

namespace Drop.Application.Branches.UpdateBranch;

public sealed class UpdateBranchRequestValidator
    : AbstractValidator<UpdateBranchRequest>
{
    public UpdateBranchRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithErrorCode("name.required")
            .MaximumLength(200)
            .WithErrorCode("name.too_long");

        RuleFor(x => x)
            .Must(x => x.Latitude.HasValue == x.Longitude.HasValue)
            .WithName("Location")
            .WithErrorCode("location.incomplete")
            .WithMessage("Provide both latitude and longitude, or neither.");

        RuleFor(x => x.Latitude!.Value)
            .InclusiveBetween(-90, 90)
            .WithErrorCode("latitude.out_of_range")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude!.Value)
            .InclusiveBetween(-180, 180)
            .WithErrorCode("longitude.out_of_range")
            .When(x => x.Longitude.HasValue);
    }
}
