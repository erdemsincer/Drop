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
    private readonly TimeProvider _timeProvider;

    public CreateBusinessService(
        IBusinessRepository businessRepository,
        IBusinessMemberRepository memberRepository,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _businessRepository = businessRepository;
        _memberRepository = memberRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    public async Task<CreateBusinessResponse> ExecuteAsync(
        CreateBusinessRequest request,
        CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();

        // Names are not unique: two cafés in different cities may share one.
        // Starts Pending: drops can be published only after manual approval.
        var business = new Business(name, _timeProvider.GetUtcNow());

        var member = new BusinessMember(
            business.Id,
            _currentUser.Id,
            BusinessMemberRole.Owner);

        await _businessRepository.AddAsync(business, cancellationToken);
        await _memberRepository.AddAsync(member, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new CreateBusinessResponse(business.Id, business.Name, business.Status);
    }
}
