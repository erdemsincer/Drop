using FluentValidation;

namespace Drop.Application.Drops.CreateDrop;

public sealed class CreateDropRequestValidator
    : AbstractValidator<CreateDropRequest>
{
    public CreateDropRequestValidator()
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

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(5, 360)
            .WithErrorCode("duration.out_of_range");

        RuleFor(x => x.ClaimDurationMinutes)
            .InclusiveBetween(1, 60)
            .WithErrorCode("claim_duration.out_of_range");

        // Relative to the wall clock only; the service re-checks against TimeProvider.
        RuleFor(x => x.StartsAt!.Value)
            .LessThanOrEqualTo(_ => DateTimeOffset.UtcNow.AddDays(30))
            .WithName("StartsAt")
            .WithErrorCode("starts_at.too_far")
            .WithMessage("A drop can be scheduled at most 30 days ahead.")
            .When(x => x.StartsAt.HasValue);

        RuleFor(x => x.ClaimDurationMinutes)
            .LessThanOrEqualTo(x => x.DurationMinutes)
            .WithErrorCode("claim_duration.exceeds_drop_duration")
            .WithMessage("Claim duration cannot be longer than drop duration.");

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
    }
}
