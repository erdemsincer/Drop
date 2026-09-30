using FluentValidation;

namespace Drop.Application.Businesses.RenameBusiness;

public sealed record RenameBusinessRequest(string Name);

public sealed record RenameBusinessResponse(Guid Id, string Name);

public sealed class RenameBusinessRequestValidator
    : AbstractValidator<RenameBusinessRequest>
{
    public RenameBusinessRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithErrorCode("name.required")
            .MaximumLength(200)
            .WithErrorCode("name.too_long");
    }
}
