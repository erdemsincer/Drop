namespace Drop.Application.Businesses.GetMyBusinesses;

public interface IMyBusinessesQuery
{
    Task<IReadOnlyList<MyBusinessResponse>> GetAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
