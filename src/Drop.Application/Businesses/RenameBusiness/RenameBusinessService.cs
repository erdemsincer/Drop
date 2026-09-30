using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.RenameBusiness;

public sealed class RenameBusinessService
{
    private readonly IBusinessRepository _businessRepository;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public RenameBusinessService(
        IBusinessRepository businessRepository,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork)
    {
        _businessRepository = businessRepository;
        _accessService = accessService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    /// <summary>Only the owner renames: the name is how customers recognise the business.</summary>
    public async Task<RenameBusinessResponse> ExecuteAsync(
        Guid businessId,
        RenameBusinessRequest request,
        CancellationToken cancellationToken = default)
    {
        var business = await _businessRepository.GetByIdAsync(businessId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Business.NotFound, "Business was not found.");

        var role = await _accessService.GetBusinessRoleAsync(_currentUser.Id, businessId, cancellationToken);

        if (role != BusinessMemberRole.Owner)
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "Only the owner can rename the business.");
        }

        business.ChangeName(request.Name);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new RenameBusinessResponse(business.Id, business.Name);
    }
}
