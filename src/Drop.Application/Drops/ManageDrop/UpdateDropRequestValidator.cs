using FluentValidation;

namespace Drop.Application.Drops.ManageDrop;

public sealed class UpdateDropRequestValidator
    : AbstractValidator<UpdateDropRequest>
{
    public UpdateDropRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithErrorCode("title.required")
            .MaximumLength(200)
            .WithErrorCode("title.too_long");

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithErrorCode("description.too_long");

        RuleFor(x => x.MinimumSpend)
            .GreaterThanOrEqualTo(0)
            .WithErrorCode("minimum_spend.invalid")
            .When(x => x.MinimumSpend.HasValue);

        RuleFor(x => x.Capacity)
            .InclusiveBetween(1, 1000)
            .WithErrorCode("capacity.out_of_range");

        RuleFor(x => x.Category)
            .IsInEnum()
            .WithErrorCode("category.invalid");
    }
}
