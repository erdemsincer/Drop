using FluentValidation;

namespace Drop.Application.Authentication.Login;

public sealed class LoginRequestValidator
    : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
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
            .MaximumLength(128)
            .WithErrorCode("password.too_long");
    }
}
