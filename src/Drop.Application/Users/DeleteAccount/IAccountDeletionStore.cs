namespace Drop.Application.Users.DeleteAccount;

public interface IAccountDeletionStore
{
    /// <summary>
    /// In one transaction: cancels the user's live reservations, deletes the
    /// businesses they own (with branches and drops) and deletes the user
    /// (memberships and sessions cascade). Past claims stay for business
    /// statistics but no longer point to any personal data.
    /// </summary>
    Task DeleteAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
