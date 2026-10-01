using System.Globalization;
using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Branches;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Media;
using Drop.Domain.Drops;

namespace Drop.Application.Drops.Schedules;

/// <summary>Recurring drops of a branch: set up, list, pause/resume and remove.</summary>
public sealed class DropScheduleService
{
    private readonly IDropScheduleStore _store;
    private readonly IBranchRepository _branchRepository;
    private readonly IBusinessRepository _businessRepository;
    private readonly IBusinessAccessService _accessService;
    private readonly IMediaStore _mediaStore;
    private readonly ICurrentUser _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _timeProvider;

    public DropScheduleService(
        IDropScheduleStore store,
        IBranchRepository branchRepository,
        IBusinessRepository businessRepository,
        IBusinessAccessService accessService,
        IMediaStore mediaStore,
        ICurrentUser currentUser,
        IUnitOfWork unitOfWork,
        TimeProvider timeProvider)
    {
        _store = store;
        _branchRepository = branchRepository;
        _businessRepository = businessRepository;
        _accessService = accessService;
        _mediaStore = mediaStore;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _timeProvider = timeProvider;
    }

    public async Task<DropScheduleResponse> CreateAsync(
        Guid branchId,
        CreateDropScheduleRequest request,
        CancellationToken cancellationToken = default)
    {
        var branch = await _branchRepository.GetByIdAsync(branchId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Branch.NotFound, "Branch was not found.");

        await EnsureCanManageAsync(branchId, cancellationToken);

        if (branch.IsClosed)
            throw new ConflictException(ErrorCodes.Branch.Closed, "Reopen the branch before publishing drops.");

        var business = await _businessRepository.GetByBranchIdAsync(branchId, cancellationToken);
        if (business is null || !business.CanPublishDrops)
            throw new ConflictException(ErrorCodes.Business.NotApproved, "The business must be approved before publishing drops.");

        if (request.PhotoId is { } photoId && !await _mediaStore.ExistsAsync(photoId, cancellationToken))
            throw new ConflictException(ErrorCodes.Drop.PhotoNotFound, "The photo was not found; upload it again.");

        var now = _timeProvider.GetUtcNow();

        DropSchedule schedule;
        try
        {
            schedule = new DropSchedule(
                branchId,
                _currentUser.Id,
                request.Title,
                request.Description,
                request.MinimumSpend,
                request.Capacity,
                TimeSpan.FromMinutes(request.DurationMinutes),
                TimeSpan.FromMinutes(request.ClaimDurationMinutes),
                request.Category ?? DropCategory.Other,
                request.OriginalPrice,
                request.DealPrice,
                request.PhotoId,
                TimeOnly.ParseExact(request.StartTime, "HH:mm", CultureInfo.InvariantCulture),
                ScheduleDayMapping.ToFlags(request.Days),
                now);
        }
        catch (DropDomainException ex)
        {
            throw new ConflictException(ex.Code, ex.Message);
        }

        _store.Add(schedule);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToResponse(schedule, now);
    }

    public async Task<IReadOnlyList<DropScheduleResponse>> ListAsync(Guid branchId, CancellationToken cancellationToken = default)
    {
        await EnsureCanManageAsync(branchId, cancellationToken);

        var now = _timeProvider.GetUtcNow();
        var schedules = await _store.ListByBranchAsync(branchId, cancellationToken);
        return schedules.Select(schedule => ToResponse(schedule, now)).ToList();
    }

    public async Task<DropScheduleResponse> SetPausedAsync(Guid scheduleId, bool paused, CancellationToken cancellationToken = default)
    {
        var schedule = await GetManagedAsync(scheduleId, cancellationToken);

        if (paused) schedule.Pause();
        else schedule.Resume();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToResponse(schedule, _timeProvider.GetUtcNow());
    }

    public async Task DeleteAsync(Guid scheduleId, CancellationToken cancellationToken = default)
    {
        var schedule = await GetManagedAsync(scheduleId, cancellationToken);
        await _store.DeleteAsync(schedule, _timeProvider.GetUtcNow(), cancellationToken);
    }

    private async Task<DropSchedule> GetManagedAsync(Guid scheduleId, CancellationToken cancellationToken)
    {
        var schedule = await _store.GetAsync(scheduleId, cancellationToken)
            ?? throw new NotFoundException("schedule.not_found", "Schedule was not found.");

        await EnsureCanManageAsync(schedule.BranchId, cancellationToken);
        return schedule;
    }

    private async Task EnsureCanManageAsync(Guid branchId, CancellationToken cancellationToken)
    {
        if (!await _accessService.CanManageBranchAsync(_currentUser.Id, branchId, cancellationToken))
            throw new ForbiddenException(ErrorCodes.Business.AccessDenied, "You cannot manage this business.");
    }

    private static DropScheduleResponse ToResponse(DropSchedule schedule, DateTimeOffset now) => new(
        schedule.Id,
        schedule.BranchId,
        schedule.Title,
        schedule.Capacity,
        (int)schedule.Duration.TotalMinutes,
        (int)schedule.ClaimDuration.TotalMinutes,
        schedule.Category,
        schedule.OriginalPrice,
        schedule.DealPrice,
        schedule.PhotoId,
        schedule.StartTime.ToString("HH:mm", CultureInfo.InvariantCulture),
        ScheduleDayMapping.ToIso(schedule.Days),
        schedule.IsPaused,
        schedule.IsPaused ? null : schedule.NextStartAfter(now));
}
