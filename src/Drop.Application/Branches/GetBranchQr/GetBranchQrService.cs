using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Security;

namespace Drop.Application.Branches.GetBranchQr;

public sealed class GetBranchQrService
{
    private readonly IBranchRepository _branchRepository;
    private readonly IBusinessAccessService _accessService;
    private readonly IBranchQrCodeService _qrCodeService;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public GetBranchQrService(
        IBranchRepository branchRepository,
        IBusinessAccessService accessService,
        IBranchQrCodeService qrCodeService,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _branchRepository = branchRepository;
        _accessService = accessService;
        _qrCodeService = qrCodeService;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<BranchQrResponse> ExecuteAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        if (await _branchRepository.GetByIdAsync(branchId, cancellationToken) is null)
        {
            throw new NotFoundException(ErrorCodes.Branch.NotFound, "Branch was not found.");
        }

        // Any member may show the QR: presenting it at the counter is the staff's job.
        var role = await _accessService.GetBranchRoleAsync(_currentUser.Id, branchId, cancellationToken);

        if (!BusinessRoles.CanShowQr(role))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You are not a member of this business.");
        }

        var code = _qrCodeService.Generate(branchId, _timeProvider.GetUtcNow());

        return new BranchQrResponse(code.Payload, code.RefreshAt, code.PeriodSeconds);
    }
}
