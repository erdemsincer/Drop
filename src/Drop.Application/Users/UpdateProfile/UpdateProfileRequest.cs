using FluentValidation;

namespace Drop.Application.Users.UpdateProfile;

public sealed record UpdateProfileRequest(
    string FirstName,
    string LastName);

public sealed class UpdateProfileRequestValidator
    : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
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
