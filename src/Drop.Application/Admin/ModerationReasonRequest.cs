using FluentValidation;

namespace Drop.Application.Admin;

public sealed record ModerationReasonRequest(string Reason);

public sealed class ModerationReasonRequestValidator
    : AbstractValidator<ModerationReasonRequest>
{
    public ModerationReasonRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithErrorCode("reason.required")
            .MaximumLength(500)
            .WithErrorCode("reason.too_long");
    }
}
