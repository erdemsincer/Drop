using FluentValidation;

namespace Drop.Application.Businesses.CreateBusiness;

public sealed class CreateBusinessRequestValidator
    : AbstractValidator<CreateBusinessRequest>
{
    public CreateBusinessRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithErrorCode("name.required")
            .MaximumLength(200)
            .WithErrorCode("name.too_long");
    }
}
