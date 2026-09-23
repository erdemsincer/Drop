using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Branches;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Security;
using Drop.Domain.Branches;

namespace Drop.Application.BranchQrTokens.Create;

public sealed class CreateBranchQrTokenService
{
    private readonly IBranchRepository _branchRepository;
    private readonly IBranchQrTokenRepository _tokenRepository;
    private readonly IQrTokenGenerator _tokenGenerator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;

    public CreateBranchQrTokenService(
        IBranchRepository branchRepository,
        IBranchQrTokenRepository tokenRepository,
        IQrTokenGenerator tokenGenerator,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider,
        IBusinessAccessService accessService,
        ICurrentUser currentUser)
    {
        _branchRepository = branchRepository;
        _tokenRepository = tokenRepository;
        _tokenGenerator = tokenGenerator;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
        _accessService = accessService;
        _currentUser = currentUser;
    }

    public async Task<CreateBranchQrTokenResponse> ExecuteAsync(
        Guid branchId,
        CancellationToken cancellationToken = default)
    {
        var branch = await _branchRepository.GetByIdAsync(
            branchId,
            cancellationToken);

        if (branch is null)
        {
            throw new NotFoundException(
                ErrorCodes.Branch.NotFound,
                "Branch was not found.");
        }

        // Any member may show the QR: presenting it at the counter is the staff's job.
        var role = await _accessService.GetBranchRoleAsync(
            _currentUser.Id,
            branchId,
            cancellationToken);

        if (!BusinessRoles.CanShowQr(role))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You are not a member of this business.");
        }

        var now = _timeProvider.GetUtcNow();

        await _tokenRepository.RevokeActiveTokensAsync(
            branchId,
            now,
            cancellationToken);

        var rawToken = _tokenGenerator.Generate();
        var tokenHash = _tokenGenerator.Hash(rawToken);

        var qrToken = new BranchQrToken(
            branchId,
            tokenHash,
            now);

        await _tokenRepository.AddAsync(
            qrToken,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateBranchQrTokenResponse(rawToken);
    }
}
