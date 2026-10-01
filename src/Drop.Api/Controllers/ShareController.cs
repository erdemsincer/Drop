using System.Globalization;
using System.Net;
using System.Reflection;
using Drop.Application.Common.Exceptions;
using Drop.Application.Features.Drops.GetDropDetail;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

/// <summary>
/// The page behind a shared drop link: a preview anyone can open (with Open
/// Graph tags for chat apps) and a button that opens the drop in the app.
/// </summary>
[ApiController]
[Route("d")]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class ShareController : ControllerBase
{
    private const string AppScheme = "dropmobile";

    private static readonly Lazy<string> Template = new(() =>
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("Drop.Api.Share.drop.html")
            ?? throw new InvalidOperationException("Share page is not embedded.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    });

    // Mirrors the app's category labels and tints (mobile: features/drops/utils/categories.ts).
    private static readonly Dictionary<string, (string Label, string Tint)> Categories = new()
    {
        ["Food"] = ("YEMEK", "#F2543D"),
        ["Coffee"] = ("KAHVE", "#9A6240"),
        ["Dessert"] = ("TATLI", "#E0479E"),
        ["Drinks"] = ("İÇECEK", "#E8900C"),
        ["Beauty"] = ("BAKIM", "#9B51E0"),
        ["Shopping"] = ("ALIŞVERİŞ", "#2D8CDB"),
        ["Entertainment"] = ("EĞLENCE", "#12A36A"),
        ["Other"] = ("FIRSAT", "#6D4AFF"),
    };

    [HttpGet("{id:guid}")]
    public async Task<ContentResult> Drop(
        Guid id,
        [FromServices] GetDropDetailService service,
        [FromServices] TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        DropDetailResponse? drop;
        try
        {
            drop = await service.ExecuteAsync(id, cancellationToken);
        }
        catch (NotFoundException)
        {
            drop = null;
        }

        Response.Headers.CacheControl = "public, max-age=60";

        var now = timeProvider.GetUtcNow();

        if (drop is null || drop.EndsAt <= now)
        {
            return Render(
                "Bu Drop sona erdi · Drop",
                "Yakınındaki anlık fırsatları kaçırmamak için Drop'u indir.",
                Categories["Other"].Tint,
                """
                    <div class="gone">
                      <h1>Bu Drop sona erdi</h1>
                      <p class="desc">Drop'lar kısa sürer ve hızlı tükenir. Yakınındaki yeni fırsatlar uygulamada seni bekliyor.</p>
                      <a class="cta" href="dropmobile://">Drop'u aç <i>→</i></a>
                    </div>
                """);
        }

        var (label, tint) = Categories.GetValueOrDefault(drop.Category, Categories["Other"]);
        string E(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

        var remaining = drop.RemainingCapacity > 0 ? $"{drop.RemainingCapacity}/{drop.Capacity}" : "Tükendi";
        var spend = drop.MinimumSpend is { } minimum
            ? $"<div class=\"stat\"><b>₺{minimum.ToString("0.##", CultureInfo.GetCultureInfo("tr-TR"))}</b><span>Min. harcama</span></div>"
            : string.Empty;

        var card = $"""
                <div class="hero">
                  <span class="chip">{E(label)}</span>
                  <div class="where">{E(drop.BusinessName)}</div>
                  <div class="branch">{E(drop.BranchName)}</div>
                </div>
                <div class="body">
                  <h1>{E(drop.Title)}</h1>
                  {(string.IsNullOrWhiteSpace(drop.Description) ? string.Empty : $"<p class=\"desc\">{E(drop.Description)}</p>")}
                  <div class="stats">
                    <div class="stat"><b id="left" data-ends="{drop.EndsAt.UtcDateTime:O}">—</b><span>Kalan süre</span></div>
                    <div class="stat"><b>{E(remaining)}</b><span>Kalan yer</span></div>
                    {spend}
                  </div>
                  <a class="cta" href="{AppScheme}://drop/{drop.Id}">Drop'ta aç ve yakala <i>→</i></a>
                  <p class="hint">Sınırlı sayıda ve kısa süreli. Kaçırma!</p>
                </div>
            """;

        return Render(
            $"{drop.Title} · {drop.BusinessName}",
            drop.RemainingCapacity > 0
                ? $"{drop.BusinessName} ({drop.BranchName}) — son {drop.RemainingCapacity} yer. Drop'ta yakala!"
                : $"{drop.BusinessName} ({drop.BranchName}) — bu Drop tükendi.",
            tint,
            card);
    }

    private ContentResult Render(string title, string description, string tint, string card) =>
        Content(
            Template.Value
                .Replace("{{OG_TITLE}}", WebUtility.HtmlEncode(title))
                .Replace("{{OG_DESCRIPTION}}", WebUtility.HtmlEncode(description))
                .Replace("{{TINT}}", tint)
                .Replace("{{CARD}}", card),
            "text/html; charset=utf-8");
}
