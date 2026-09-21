using Drop.Application.Abstractions;
using Drop.Application.Branches;

namespace Drop.Application.Drops.CreateDrop;

public sealed class CreateDropService
{
    private readonly IBranchRepository _branchRepository;
    private readonly IDropRepository _dropRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public CreateDropService(
        IBranchRepository branchRepository,
        IDropRepository dropRepository,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _branchRepository = branchRepository;
        _dropRepository = dropRepository;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    public async Task<CreateDropResponse> ExecuteAsync(
        Guid branchId,
        CreateDropRequest request,
        CancellationToken cancellationToken = default)
    {
        var branch = await _branchRepository.GetByIdAsync(
            branchId,
            cancellationToken);

        if (branch is null)
        {
            throw new InvalidOperationException(
                "Branch was not found.");
        }

        var drop = new Domain.Drops.Drop(
            branchId,
            request.Title,
            request.Description,
            request.MinimumSpend,
            request.Capacity,
            TimeSpan.FromMinutes(request.DurationMinutes),
            TimeSpan.FromMinutes(request.ClaimDurationMinutes));

        var now = _timeProvider.GetUtcNow();

        drop.Activate(now);

        await _dropRepository.AddAsync(
            drop,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(
            cancellationToken);

        return new CreateDropResponse(
            drop.Id,
            drop.BranchId,
            drop.Title,
            drop.Capacity,
            drop.StartsAt!.Value,
            drop.EndsAt!.Value);
    }
}
