using FluentValidation;

namespace Drop.Application.Branches.CreateBranch;

public sealed class CreateBranchRequestValidator
    : AbstractValidator<CreateBranchRequest>
{
    public CreateBranchRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithErrorCode("name.required")
            .MaximumLength(200)
            .WithErrorCode("name.too_long");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithErrorCode("latitude.out_of_range");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithErrorCode("longitude.out_of_range");
    }
}
