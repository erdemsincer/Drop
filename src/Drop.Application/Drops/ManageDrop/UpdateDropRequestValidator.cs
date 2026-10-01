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

        RuleFor(x => x.OriginalPrice)
            .NotNull()
            .WithErrorCode("pricing.incomplete")
            .WithMessage("Give both prices, or neither.")
            .When(x => x.DealPrice.HasValue);

        RuleFor(x => x.DealPrice)
            .NotNull()
            .WithErrorCode("pricing.incomplete")
            .WithMessage("Give both prices, or neither.")
            .When(x => x.OriginalPrice.HasValue);

        RuleFor(x => x.OriginalPrice)
            .GreaterThan(0)
            .WithErrorCode("original_price.invalid")
            .LessThanOrEqualTo(1_000_000)
            .WithErrorCode("original_price.invalid")
            .When(x => x.OriginalPrice.HasValue);

        RuleFor(x => x.DealPrice!.Value)
            .GreaterThanOrEqualTo(0)
            .WithName("DealPrice")
            .WithErrorCode("deal_price.invalid")
            .LessThan(x => x.OriginalPrice!.Value)
            .WithErrorCode("deal_price.not_lower")
            .WithMessage("The deal price must be lower than the original price.")
            .When(x => x.DealPrice.HasValue && x.OriginalPrice.HasValue);
            RuleFor(x => x.StartPrice!.Value)
            .GreaterThan(x => x.DealPrice ?? decimal.MaxValue)
            .WithName("StartPrice")
            .WithErrorCode("start_price.invalid")
            .WithMessage("The start price must be above the lowest price.")
            .LessThanOrEqualTo(x => x.OriginalPrice ?? 0)
            .WithErrorCode("start_price.invalid")
            .When(x => x.StartPrice.HasValue);
    }
}
