using Drop.Domain.Drops;
using FluentValidation;

namespace Drop.Application.Drops.Schedules;

/// <param name="StartTime">Local (Turkey) time, "HH:mm".</param>
/// <param name="Days">ISO weekdays the drop runs on: 1 = Monday … 7 = Sunday.</param>
public sealed record CreateDropScheduleRequest(
    string Title,
    string? Description,
    decimal? MinimumSpend,
    int Capacity,
    int DurationMinutes,
    int ClaimDurationMinutes,
    string StartTime,
    IReadOnlyList<int> Days,
    DropCategory? Category = null,
    decimal? OriginalPrice = null,
    decimal? DealPrice = null,
    Guid? PhotoId = null);

public sealed record DropScheduleResponse(
    Guid Id,
    Guid BranchId,
    string Title,
    int Capacity,
    int DurationMinutes,
    int ClaimDurationMinutes,
    DropCategory Category,
    decimal? OriginalPrice,
    decimal? DealPrice,
    Guid? PhotoId,
    string StartTime,
    IReadOnlyList<int> Days,
    bool IsPaused,
    DateTimeOffset? NextStartAt);

public interface IDropScheduleStore
{
    void Add(DropSchedule schedule);

    Task<DropSchedule?> GetAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DropSchedule>> ListByBranchAsync(Guid branchId, CancellationToken cancellationToken = default);

    /// <summary>Removes the schedule and cancels its occurrences that haven't started yet.</summary>
    Task DeleteAsync(DropSchedule schedule, DateTimeOffset now, CancellationToken cancellationToken = default);
}

public sealed class CreateDropScheduleRequestValidator : AbstractValidator<CreateDropScheduleRequest>
{
    public CreateDropScheduleRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithErrorCode("title.required").MaximumLength(200).WithErrorCode("title.too_long");
        RuleFor(x => x.Description).MaximumLength(1000).WithErrorCode("description.too_long");
        RuleFor(x => x.MinimumSpend).GreaterThanOrEqualTo(0).WithErrorCode("minimum_spend.invalid").When(x => x.MinimumSpend.HasValue);
        RuleFor(x => x.Capacity).InclusiveBetween(1, 1000).WithErrorCode("capacity.out_of_range");
        RuleFor(x => x.DurationMinutes).InclusiveBetween(5, 360).WithErrorCode("duration.out_of_range");
        RuleFor(x => x.ClaimDurationMinutes).InclusiveBetween(1, 60).WithErrorCode("claim_duration.out_of_range");
        RuleFor(x => x.ClaimDurationMinutes)
            .LessThanOrEqualTo(x => x.DurationMinutes)
            .WithErrorCode("claim_duration.exceeds_drop_duration");
        RuleFor(x => x.Category).IsInEnum().WithErrorCode("category.invalid");

        RuleFor(x => x.StartTime)
            .Must(value => TimeOnly.TryParseExact(value, "HH:mm", out _))
            .WithErrorCode("start_time.invalid")
            .WithMessage("Use HH:mm, e.g. 15:00.");

        RuleFor(x => x.Days)
            .NotEmpty()
            .WithErrorCode("days.required")
            .Must(days => days.All(day => day is >= 1 and <= 7))
            .WithErrorCode("days.invalid");

        RuleFor(x => x.OriginalPrice).NotNull().WithErrorCode("pricing.incomplete").When(x => x.DealPrice.HasValue);
        RuleFor(x => x.DealPrice).NotNull().WithErrorCode("pricing.incomplete").When(x => x.OriginalPrice.HasValue);
        RuleFor(x => x.DealPrice!.Value)
            .LessThan(x => x.OriginalPrice!.Value)
            .WithName("DealPrice")
            .WithErrorCode("deal_price.not_lower")
            .When(x => x.DealPrice.HasValue && x.OriginalPrice.HasValue);
    }
}

public static class ScheduleDayMapping
{
    public static ScheduleDays ToFlags(IEnumerable<int> isoDays) =>
        isoDays.Aggregate(ScheduleDays.None, (flags, day) => flags | (ScheduleDays)(1 << (day - 1)));

    public static IReadOnlyList<int> ToIso(ScheduleDays flags) =>
        Enumerable.Range(1, 7).Where(day => flags.HasFlag((ScheduleDays)(1 << (day - 1)))).ToList();
}
