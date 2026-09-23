using Drop.Application.Common.Errors;
using Drop.Application.Common.Exceptions;

namespace Drop.Application.Features.Drops.GetDropDetail;

public sealed class GetDropDetailService
{
    private readonly IDropDetailQuery _query;
    private readonly TimeProvider _timeProvider;

    public GetDropDetailService(
        IDropDetailQuery query,
        TimeProvider timeProvider)
    {
        _query = query;
        _timeProvider = timeProvider;
    }

    public async Task<DropDetailResponse> ExecuteAsync(
        Guid dropId,
        CancellationToken cancellationToken = default)
    {
        var result = await _query.GetAsync(
            dropId,
            _timeProvider.GetUtcNow(),
            cancellationToken);

        if (result is null)
        {
            throw new NotFoundException(
                ErrorCodes.Drop.NotFound,
                "Drop was not found.");
        }

        return result;
    }
}