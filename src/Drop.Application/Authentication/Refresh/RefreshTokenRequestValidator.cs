using FluentValidation;

namespace Drop.Application.Authentication.Refresh;

public sealed class RefreshTokenRequestValidator
    : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty()
            .WithErrorCode("refresh_token.required")
            .MaximumLength(200)
            .WithErrorCode("refresh_token.invalid");
    }
}
