using FluentValidation;

namespace Drop.Application.Authentication.Register;

public sealed class RegisterRequestValidator
    : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithErrorCode("email.required")
            .EmailAddress()
            .WithErrorCode("email.invalid")
            .MaximumLength(320)
            .WithErrorCode("email.too_long");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithErrorCode("password.required")
            .MinimumLength(8)
            .WithErrorCode("password.too_short")
            .MaximumLength(128)
            .WithErrorCode("password.too_long");

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithErrorCode("first_name.required")
            .MaximumLength(100)
            .WithErrorCode("first_name.too_long");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithErrorCode("last_name.required")
            .MaximumLength(100)
            .WithErrorCode("last_name.too_long");
    }
}
