using Drop.Application.Abstractions;
using Drop.Application.Businesses;
using Drop.Domain.Branches;

namespace Drop.Application.Branches.CreateBranch;

public sealed class CreateBranchService
{
    private readonly IBusinessRepository _businessRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBranchService(
        IBusinessRepository businessRepository,
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork)
    {
        _businessRepository = businessRepository;
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CreateBranchResponse> ExecuteAsync(
        Guid businessId,
        CreateBranchRequest request,
        CancellationToken cancellationToken = default)
    {
        var businessExists =
            await _businessRepository.ExistsAsync(
                businessId,
                cancellationToken);

        if (!businessExists)
        {
            throw new InvalidOperationException(
                "Business was not found.");
        }

        var branch = new Branch(
            businessId,
            request.Name,
            new Location(
                request.Latitude,
                request.Longitude));

        await _branchRepository.AddAsync(
            branch,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return new CreateBranchResponse(
            branch.Id,
            branch.BusinessId,
            branch.Name,
            branch.Location.Latitude,
            branch.Location.Longitude);
    }
}
