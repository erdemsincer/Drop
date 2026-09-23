using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Users;
using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.Members;

public sealed class BusinessMembersService
{
    private readonly IBusinessMembersQuery _query;
    private readonly IBusinessMemberRepository _memberRepository;
    private readonly IBusinessRepository _businessRepository;
    private readonly IUserRepository _userRepository;
    private readonly IBusinessAccessService _accessService;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public BusinessMembersService(
        IBusinessMembersQuery query,
        IBusinessMemberRepository memberRepository,
        IBusinessRepository businessRepository,
        IUserRepository userRepository,
        IBusinessAccessService accessService,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork)
    {
        _query = query;
        _memberRepository = memberRepository;
        _businessRepository = businessRepository;
        _userRepository = userRepository;
        _accessService = accessService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<MemberResponse>> ListAsync(
        Guid businessId,
        CancellationToken cancellationToken = default)
    {
        var actorRole = await GetActorRoleAsync(businessId, cancellationToken);
        var rows = await _query.GetAsync(businessId, cancellationToken);

        return rows
            .Select(row => new MemberResponse(
                row.UserId,
                row.FirstName,
                row.LastName,
                row.Email,
                row.Role,
                row.UserId == _currentUser.Id,
                row.UserId == _currentUser.Id
                    ? row.Role != BusinessMemberRole.Owner
                    : BusinessRoles.CanManageMember(actorRole, row.Role)))
            .ToList();
    }

    public async Task<MemberResponse> AddAsync(
        Guid businessId,
        AddMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        var actorRole = await GetActorRoleAsync(businessId, cancellationToken);

        if (!BusinessRoles.CanManageMember(actorRole, request.Role))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot add a member with this role.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        // Members must already have a Drop account; there is no e-mail invite yet.
        var user = await _userRepository.GetByEmailAsync(email, cancellationToken)
            ?? throw new NotFoundException(
                ErrorCodes.Member.UserNotFound,
                "No Drop account uses this e-mail.");

        if (await _memberRepository.GetAsync(businessId, user.Id, cancellationToken) is not null)
        {
            throw new ConflictException(
                ErrorCodes.Member.AlreadyExists,
                "This user is already a member of the business.");
        }

        await _memberRepository.AddAsync(
            new BusinessMember(businessId, user.Id, request.Role),
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new MemberResponse(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            request.Role,
            IsCurrentUser: false,
            CanRemove: BusinessRoles.CanManageMember(actorRole, request.Role));
    }

    public async Task RemoveAsync(
        Guid businessId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var actorRole = await GetActorRoleAsync(businessId, cancellationToken);

        var member = await _memberRepository.GetAsync(businessId, userId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Member.NotFound, "Member was not found.");

        if (member.Role == BusinessMemberRole.Owner)
        {
            throw new ConflictException(
                ErrorCodes.Member.CannotRemoveOwner,
                "The owner cannot be removed from the business.");
        }

        var leavingSelf = userId == _currentUser.Id;

        if (!leavingSelf && !BusinessRoles.CanManageMember(actorRole, member.Role))
        {
            throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You cannot remove this member.");
        }

        _memberRepository.Remove(member);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<BusinessMemberRole> GetActorRoleAsync(
        Guid businessId,
        CancellationToken cancellationToken)
    {
        if (!await _businessRepository.ExistsAsync(businessId, cancellationToken))
        {
            throw new NotFoundException(ErrorCodes.Business.NotFound, "Business was not found.");
        }

        return await _accessService.GetBusinessRoleAsync(_currentUser.Id, businessId, cancellationToken)
            ?? throw new ForbiddenException(
                ErrorCodes.Business.AccessDenied,
                "You are not a member of this business.");
    }
}
