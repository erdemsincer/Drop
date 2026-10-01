using System.Collections.Concurrent;
using System.Net;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.Controllers;

/// <summary>
/// Public privacy policy (KVKK notice) and terms of use, linked from the app
/// and from the store listings. The texts are embedded HTML (see /Legal);
/// who runs Drop and how to reach them come from configuration.
/// </summary>
[ApiController]
[Route("legal")]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class LegalController : ControllerBase
{
    // Bump when the wording changes in a way users should notice.
    private const string Updated = "1 Ekim 2026";

    private static readonly ConcurrentDictionary<string, string> Pages = new();

    private readonly IConfiguration _configuration;

    public LegalController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("privacy")]
    public ContentResult Privacy() => Page("privacy", "Gizlilik Politikası ve KVKK Aydınlatma Metni");

    [HttpGet("terms")]
    public ContentResult Terms() => Page("terms", "Kullanım Koşulları");

    private ContentResult Page(string name, string title)
    {
        var html = Pages.GetOrAdd(name, _ => Read("layout")
            .Replace("{{TITLE}}", title)
            .Replace("{{UPDATED}}", Updated)
            .Replace("{{BODY}}", Read(name)));

        var controller = _configuration["Legal:ControllerName"] is { Length: > 0 } configuredName ? configuredName : "Drop";
        var contact = _configuration["Legal:ContactEmail"] is { Length: > 0 } email
            ? $"<a href=\"mailto:{WebUtility.HtmlEncode(email)}\">{WebUtility.HtmlEncode(email)}</a>"
            : "uygulama içindeki iletişim kanalları";

        Response.Headers.CacheControl = "public, max-age=3600";

        return Content(
            html.Replace("{{CONTROLLER}}", WebUtility.HtmlEncode(controller)).Replace("{{CONTACT}}", contact),
            "text/html; charset=utf-8");
    }

    private static string Read(string name)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream($"Drop.Api.Legal.{name}.html")
            ?? throw new InvalidOperationException($"Legal page '{name}' is not embedded.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
