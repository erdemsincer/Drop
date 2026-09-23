using FluentValidation;

namespace Drop.Application.Claims.RedeemClaim;

public sealed class RedeemClaimRequestValidator
    : AbstractValidator<RedeemClaimRequest>
{
    public RedeemClaimRequestValidator()
    {
        RuleFor(x => x.QrToken)
            .NotEmpty()
            .WithErrorCode("qr.required")
            .MaximumLength(500)
            .WithErrorCode("qr.invalid");
    }
}
