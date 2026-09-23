using Drop.Api.Middleware;
using Drop.Application.Common.Exceptions;
using Drop.Domain.Common;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Drop.Api.ExceptionHandling;

/// <summary>
/// Centralized exception handler for all application exceptions.
/// Maps domain exceptions, validation errors, and unexpected errors to standardized ProblemDetails responses.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problemDetails = CreateProblemDetails(httpContext, exception);

        LogException(exception, problemDetails.Status ?? 500);

        httpContext.Response.StatusCode =
            problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static ProblemDetails CreateProblemDetails(HttpContext context, Exception exception)
    {
        return exception switch
        {
            ValidationException validationException =>
                CreateValidationProblem(context, validationException),

            AuthenticationException authenticationException =>
                CreateProblem(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "Authentication failed.",
                    authenticationException),

            ForbiddenException forbiddenException =>
                CreateProblem(
                    context,
                    StatusCodes.Status403Forbidden,
                    "Access denied.",
                    forbiddenException),

            NotFoundException notFoundException =>
                CreateProblem(
                    context,
                    StatusCodes.Status404NotFound,
                    "Resource not found.",
                    notFoundException),

            ConflictException conflictException =>
                CreateProblem(
                    context,
                    StatusCodes.Status409Conflict,
                    "Request conflict.",
                    conflictException),

            DomainException domainException =>
                CreateDomainProblem(context, domainException),

            _ => CreateUnexpectedProblem(context)
        };
    }

    private static ProblemDetails CreateProblem(
        HttpContext context,
        int status,
        string title,
        DropException exception)
    {
        return new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = exception.Message,
            Type = BuildType(exception.Code),
            Extensions =
            {
                ["code"] = exception.Code,
                ["traceId"] = GetTraceId(context),
                ["correlationId"] = GetCorrelationId(context)
            }
        };
    }

    private static ProblemDetails CreateDomainProblem(
        HttpContext context,
        DomainException exception)
    {
        return new ProblemDetails
        {
            Status = StatusCodes.Status409Conflict,
            Title = "Business rule violation.",
            Detail = exception.Message,
            Type = BuildType(exception.Code),
            Extensions =
            {
                ["code"] = exception.Code,
                ["traceId"] = GetTraceId(context),
                ["correlationId"] = GetCorrelationId(context)
            }
        };
    }

    private static ProblemDetails CreateValidationProblem(
        HttpContext context,
        ValidationException exception)
    {
        var errors = exception.Errors
            .GroupBy(x => x.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(x => new
                    {
                        code = x.ErrorCode,
                        message = x.ErrorMessage
                    })
                    .ToArray());

        return new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation failed.",
            Type = BuildType("validation.failed"),
            Extensions =
            {
                ["code"] = "validation.failed",
                ["errors"] = errors,
                ["traceId"] = GetTraceId(context),
                ["correlationId"] = GetCorrelationId(context)
            }
        };
    }

    private static ProblemDetails CreateUnexpectedProblem(HttpContext context)
    {
        return new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred.",
            Type = BuildType("server.unexpected"),
            Extensions =
            {
                ["code"] = "server.unexpected",
                ["traceId"] = GetTraceId(context),
                ["correlationId"] = GetCorrelationId(context)
            }
        };
    }

    private static string GetTraceId(HttpContext context)
    {
        return System.Diagnostics.Activity.Current?.TraceId.ToString()
            ?? context.TraceIdentifier;
    }

    private static string? GetCorrelationId(HttpContext context)
    {
        return context.Items.TryGetValue(CorrelationIdMiddleware.HeaderName, out var value)
            ? value as string
            : null;
    }

    private static string BuildType(string code)
    {
        var slug = code.Replace('.', '-');
        return $"https://api.drop.app/errors/{slug}";
    }

    private void LogException(Exception exception, int statusCode)
    {
        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled exception occurred.");
        }
        else
        {
            _logger.LogWarning(
                "Request failed with {StatusCode}: {Message}",
                statusCode,
                exception.Message);
        }
    }
}
