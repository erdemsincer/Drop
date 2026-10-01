using Drop.Application.Media;
using Drop.Domain.Media;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

[ApiController]
[Route("api/media")]
[Tags("Media")]
public sealed class MediaController : ControllerBase
{
    /// <summary>Uploads a drop photo (multipart field "file"); returns its id.</summary>
    [Authorize]
    [HttpPost]
    [RequestSizeLimit(MediaFile.MaxBytes + 64 * 1024)]
    public async Task<ActionResult<UploadMediaResponse>> Upload(
        IFormFile file,
        [FromServices] MediaService service,
        CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, cancellationToken);

        return Ok(await service.UploadAsync(buffer.ToArray(), cancellationToken));
    }

    /// <summary>Serves an image. Public, since drops are shared; ids are unguessable and content never changes.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(
        Guid id,
        [FromServices] MediaService service,
        CancellationToken cancellationToken)
    {
        var media = await service.GetAsync(id, cancellationToken);

        if (media is null)
            return NotFound();

        Response.Headers.CacheControl = "public, max-age=31536000, immutable";

        return File(media.Content, media.ContentType);
    }
}
