using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Domain.Businesses;

namespace Drop.Application.Businesses.CreateBusiness;

public sealed class CreateBusinessService
{
    private readonly IBusinessRepository _businessRepository;
    private readonly IBusinessMemberRepository _memberRepository;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBusinessService(
        IBusinessRepository businessRepository,
        IBusinessMemberRepository memberRepository,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork)
    {
        _businessRepository = businessRepository;
        _memberRepository = memberRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<CreateBusinessResponse> ExecuteAsync(
        CreateBusinessRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();

        // Names are not unique: two cafés in different cities may share one.
        var business = new Business(name);

        var member = new BusinessMember(
            business.Id,
            _currentUser.Id,
            BusinessMemberRole.Owner);

        await _businessRepository.AddAsync(business, cancellationToken);
        await _memberRepository.AddAsync(member, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateBusinessResponse(business.Id, business.Name);
    }
}
