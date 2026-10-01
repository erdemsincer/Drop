using Drop.Application.Authentication;
using FluentValidation;

namespace Drop.Application.Claims.RateClaim;

public sealed record RateClaimRequest(int Stars);

public sealed class RateClaimRequestValidator : AbstractValidator<RateClaimRequest>
{
    public RateClaimRequestValidator()
    {
        RuleFor(x => x.Stars)
            .InclusiveBetween(1, 5)
            .WithErrorCode("stars.out_of_range");
    }
}

/// <summary>"How was it?" after a used drop; feeds the business's star rating.</summary>
public sealed class RateClaimService
{
    private readonly IClaimStore _claimStore;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public RateClaimService(
        IClaimStore claimStore,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _claimStore = claimStore;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public Task ExecuteAsync(
        Guid claimId,
        RateClaimRequest request,
        CancellationToken cancellationToken = default)
    {
        return _claimStore.RateAsync(
            claimId,
            _currentUser.Id,
            request.Stars,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }
}
