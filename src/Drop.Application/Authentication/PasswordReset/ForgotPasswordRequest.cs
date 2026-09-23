using FluentValidation;

namespace Drop.Application.Authentication.PasswordReset;

public sealed record ForgotPasswordRequest(string Email);

public sealed class ForgotPasswordRequestValidator
    : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithErrorCode("email.required")
            .EmailAddress()
            .WithErrorCode("email.invalid")
            .MaximumLength(320)
            .WithErrorCode("email.too_long");
    }
}
