using Drop.Application.Authentication;
using Drop.Application.Businesses;
using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;
using Drop.Application.Notifications;
using Drop.Domain.Businesses;

namespace Drop.Application.Admin;

/// <summary>Manual business review for the pilot: approve, reject, suspend.</summary>
public sealed class AdminBusinessesService
{
    private readonly IAdminAccess _adminAccess;
    private readonly IAdminBusinessStore _store;
    private readonly IBusinessRepository _businessRepository;
    private readonly IEmailSender _emailSender;
    private readonly ICurrentUser _currentUser;
    private readonly TimeProvider _timeProvider;

    public AdminBusinessesService(
        IAdminAccess adminAccess,
        IAdminBusinessStore store,
        IBusinessRepository businessRepository,
        IEmailSender emailSender,
        ICurrentUser currentUser,
        TimeProvider timeProvider)
    {
        _adminAccess = adminAccess;
        _store = store;
        _businessRepository = businessRepository;
        _emailSender = emailSender;
        _currentUser = currentUser;
        _timeProvider = timeProvider;
    }

    public async Task<IReadOnlyList<AdminBusinessResponse>> ListAsync(
        BusinessStatus? status,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(cancellationToken);
        return await _store.ListAsync(status, cancellationToken);
    }

    public Task<AdminBusinessResponse> ApproveAsync(Guid businessId, CancellationToken cancellationToken = default) =>
        ModerateAsync(
            businessId,
            (business, now) => business.Approve(now),
            name => (
                $"{name} Drop'ta onaylandı 🎉",
                $"İşletmen \"{name}\" onaylandı. Artık Drop yayınlayabilirsin."),
            cancellationToken);

    public Task<AdminBusinessResponse> RejectAsync(
        Guid businessId,
        ModerationReasonRequest request,
        CancellationToken cancellationToken = default) =>
        ModerateAsync(
            businessId,
            (business, now) => business.Reject(request.Reason, now),
            name => (
                $"{name} başvurusu hakkında",
                $"İşletmen \"{name}\" şu an onaylanamadı.\n\nGerekçe: {request.Reason.Trim()}\n\nBilgileri güncelleyip bizimle iletişime geçebilirsin."),
            cancellationToken);

    public Task<AdminBusinessResponse> SuspendAsync(
        Guid businessId,
        ModerationReasonRequest request,
        CancellationToken cancellationToken = default) =>
        ModerateAsync(
            businessId,
            (business, now) => business.Suspend(request.Reason, now),
            name => (
                $"{name} askıya alındı",
                $"İşletmen \"{name}\" askıya alındı ve yayındaki Drop'ların kaldırıldı.\n\nGerekçe: {request.Reason.Trim()}"),
            cancellationToken);

    private async Task<AdminBusinessResponse> ModerateAsync(
        Guid businessId,
        Action<Business, DateTimeOffset> change,
        Func<string, (string Subject, string Body)> email,
        CancellationToken cancellationToken)
    {
        await EnsureAdminAsync(cancellationToken);

        var business = await _businessRepository.GetByIdAsync(businessId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.Business.NotFound, "Business was not found.");

        var now = _timeProvider.GetUtcNow();

        change(business, now);
        await _store.SaveStatusAsync(business, now, cancellationToken);

        var result = (await _store.GetAsync(businessId, cancellationToken))!;

        if (result.OwnerEmail is not null)
        {
            var (subject, body) = email(business.Name);

            // The decision is already saved; a mail hiccup must not undo or fail it.
            try
            {
                await _emailSender.SendAsync(result.OwnerEmail, subject, body, cancellationToken);
            }
            catch
            {
                // Best effort.
            }
        }

        return result;
    }

    private async Task EnsureAdminAsync(CancellationToken cancellationToken)
    {
        if (!await _adminAccess.IsAdminAsync(_currentUser.Id, cancellationToken))
        {
            throw new ForbiddenException(ErrorCodes.Admin.AccessDenied, "Admin access required.");
        }
    }
}
