using FluentValidation;

namespace Drop.Application.Users.DeleteAccount;

public sealed record DeleteAccountRequest(string Password);

public sealed class DeleteAccountRequestValidator
    : AbstractValidator<DeleteAccountRequest>
{
    public DeleteAccountRequestValidator()
    {
        RuleFor(x => x.Password)
            .NotEmpty()
            .WithErrorCode("password.required");
    }
}
