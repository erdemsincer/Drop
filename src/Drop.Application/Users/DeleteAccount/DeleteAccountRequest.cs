using FluentValidation;

namespace Drop.Application.Users.DeleteAccount;

public sealed record DeleteAccountRequest(string? Password);

public sealed class DeleteAccountRequestValidator
    : AbstractValidator<DeleteAccountRequest>
{
    public DeleteAccountRequestValidator()
    {
        // Optional for accounts without a password; the service checks it otherwise.
        RuleFor(x => x.Password)
            .MaximumLength(128);
    }
}
