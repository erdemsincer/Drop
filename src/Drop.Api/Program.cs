using System.Text;
using System.Text.Json.Serialization;
using Drop.Api.Configuration;
using Drop.Api.ExceptionHandling;
using Drop.Api.Middleware;
using Drop.Api.Validation;
using Drop.Application;
using Drop.Infrastructure;
using Drop.Infrastructure.Authentication;
using Drop.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;

const string CorsPolicy = "Drop";

var bootstrap = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .CreateLogger();

Log.Logger = bootstrap;

try
{
    bootstrap.Information("Starting Drop API");

    var builder = WebApplication.CreateBuilder(args);

    StartupValidation.Validate(builder.Configuration, builder.Environment);

    builder.Host.UseSerilog((context, services, configuration) =>
    {
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "Drop.Api");
    });

    builder.Services
        .AddControllers(options =>
        {
            options.Filters.Add<ValidationActionFilter>();
        })
        .AddJsonOptions(options =>
        {
            // Enums go over the wire as names ("Owner", "Active"), not numbers.
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddDropRateLimiting(builder.Configuration);

    // Native mobile apps don't need CORS. Development allows any origin (Expo web,
    // Swagger); elsewhere only the origins listed in Cors:AllowedOrigins.
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

    builder.Services.AddCors(options =>
    {
        options.AddPolicy(CorsPolicy, policy =>
        {
            if (builder.Environment.IsDevelopment())
                policy.AllowAnyOrigin();
            else
                policy.WithOrigins(allowedOrigins);

            policy.AllowAnyHeader().AllowAnyMethod();
        });
    });

    var reverseProxy = builder.Configuration.GetValue<bool>("ReverseProxy:Enabled");

    if (reverseProxy)
    {
        // Behind a platform load balancer: trust its X-Forwarded-* headers so
        // rate limiting sees the real client IP and HTTPS is detected.
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }

    var jwtOptions = builder.Configuration
        .GetSection(JwtOptions.SectionName)
        .Get<JwtOptions>()!;

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key))
            };

            options.Events = new JwtBearerEvents
            {
                OnChallenge = async context =>
                {
                    context.HandleResponse();

                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/problem+json";

                    var problem = new
                    {
                        type = "https://api.drop.app/errors/auth-unauthorized",
                        title = "Authentication required.",
                        status = StatusCodes.Status401Unauthorized,
                        code = "auth.unauthorized",
                        traceId = context.HttpContext.TraceIdentifier
                    };

                    await context.Response.WriteAsJsonAsync(problem);
                },

                OnForbidden = async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/problem+json";

                    var problem = new
                    {
                        type = "https://api.drop.app/errors/auth-forbidden",
                        title = "Access denied.",
                        status = StatusCodes.Status403Forbidden,
                        code = "auth.forbidden",
                        traceId = context.HttpContext.TraceIdentifier
                    };

                    await context.Response.WriteAsJsonAsync(problem);
                }
            };
        });

    builder.Services.AddAuthorization();

    builder.Services.AddEndpointsApiExplorer();

    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT token giriniz."
        });

        options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("bearer", document)] = []
        });
    });

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();

    var app = builder.Build();

    if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
    {
        await using var scope = app.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<DropDbContext>().Database.MigrateAsync();
    }

    if (reverseProxy)
    {
        app.UseForwardedHeaders();
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Order matters: request logging must wrap the exception handler so it
    // logs the final status (e.g. 409), not the raw exception as a 500.
    app.UseMiddleware<CorrelationIdMiddleware>();

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
        };
    });

    app.UseExceptionHandler();

    app.UseHttpsRedirection();

    app.UseCors(CorsPolicy);

    app.UseAuthentication();

    app.UseMiddleware<UserContextLoggingMiddleware>();

    app.UseAuthorization();

    // After authentication so the redeem policy can partition by user.
    app.UseRateLimiter();

    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false,
        ResponseWriter = WriteHealthResponse
    });

    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = registration => registration.Tags.Contains("ready"),
        ResponseWriter = WriteHealthResponse
    });

    app.MapControllers();

    app.Run();
}
catch (Exception exception) when (exception is not HostAbortedException)
{
    Log.Fatal(exception, "Drop API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

static async Task WriteHealthResponse(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    var response = new
    {
        status = report.Status.ToString(),
        checks = report.Entries.Select(entry => new
        {
            name = entry.Key,
            status = entry.Value.Status.ToString(),
            duration = entry.Value.Duration.TotalMilliseconds
        })
    };

    await context.Response.WriteAsJsonAsync(response);
}

public partial class Program;
