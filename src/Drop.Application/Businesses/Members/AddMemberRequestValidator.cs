using Drop.Domain.Businesses;
using FluentValidation;

namespace Drop.Application.Businesses.Members;

public sealed class AddMemberRequestValidator
    : AbstractValidator<AddMemberRequest>
{
    public AddMemberRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithErrorCode("email.required")
            .EmailAddress()
            .WithErrorCode("email.invalid")
            .MaximumLength(320)
            .WithErrorCode("email.too_long");

        RuleFor(x => x.Role)
            .Must(role => role is BusinessMemberRole.Manager or BusinessMemberRole.Staff)
            .WithErrorCode("role.invalid")
            .WithMessage("Only Manager or Staff can be added.");
    }
}
