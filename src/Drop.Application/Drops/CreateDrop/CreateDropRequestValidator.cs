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
    }
}
