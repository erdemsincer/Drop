using FluentValidation;

namespace Drop.Application.Users.ChangePassword;

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);

public sealed class ChangePasswordRequestValidator
    : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        // Empty for accounts that never had a password; the service checks it otherwise.
        RuleFor(x => x.CurrentPassword)
            .MaximumLength(128);

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithErrorCode("password.required")
            .MinimumLength(8)
            .WithErrorCode("password.too_short")
            .MaximumLength(128)
            .WithErrorCode("password.too_long")
            .NotEqual(x => x.CurrentPassword)
            .WithErrorCode("password.unchanged")
            .WithMessage("New password must differ from the current one.");
    }
}
