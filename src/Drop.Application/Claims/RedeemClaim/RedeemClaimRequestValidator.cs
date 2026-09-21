using FluentValidation;

namespace Drop.Application.Claims.RedeemClaim;

public sealed class RedeemClaimRequestValidator
    : AbstractValidator<RedeemClaimRequest>
{
    public RedeemClaimRequestValidator()
    {
        RuleFor(x => x.QrToken)
            .NotEmpty()
            .WithErrorCode("qr_token.required")
            .MaximumLength(500)
            .WithErrorCode("qr_token.too_long");
    }
}
