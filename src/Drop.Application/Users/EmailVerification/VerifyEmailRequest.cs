using FluentValidation;

namespace Drop.Application.Users.EmailVerification;

public sealed record VerifyEmailRequest(string Code);

public sealed class VerifyEmailRequestValidator
    : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithErrorCode("code.required")
            .Matches("^[0-9]{6}$")
            .WithErrorCode("code.invalid")
            .WithMessage("Code must be 6 digits.");
    }
}
