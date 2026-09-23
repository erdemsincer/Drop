using FluentValidation;

namespace Drop.Application.Authentication.PasswordReset;

public sealed record ResetPasswordRequest(
    string Email,
    string Code,
    string NewPassword);

public sealed class ResetPasswordRequestValidator
    : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithErrorCode("email.required")
            .EmailAddress()
            .WithErrorCode("email.invalid");

        RuleFor(x => x.Code)
            .NotEmpty()
            .WithErrorCode("code.required")
            .Matches("^[0-9]{6}$")
            .WithErrorCode("code.invalid")
            .WithMessage("Code must be 6 digits.");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithErrorCode("password.required")
            .MinimumLength(8)
            .WithErrorCode("password.too_short")
            .MaximumLength(128)
            .WithErrorCode("password.too_long");
    }
}
