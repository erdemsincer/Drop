using FluentValidation;

namespace Drop.Application.Authentication.External;

/// <param name="IdToken">The identity token (JWT) the provider gave the app.</param>
/// <param name="FirstName">
/// Apple shares the name only with the app, and only on the very first sign-in,
/// so the app forwards it; Google's token carries it.
/// </param>
public sealed record ExternalSignInRequest(
    string IdToken,
    string? FirstName,
    string? LastName);

public sealed class ExternalSignInRequestValidator
    : AbstractValidator<ExternalSignInRequest>
{
    public ExternalSignInRequestValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty()
            .WithErrorCode("token.required")
            .MaximumLength(8000);

        RuleFor(x => x.FirstName).MaximumLength(100);
        RuleFor(x => x.LastName).MaximumLength(100);
    }
}
