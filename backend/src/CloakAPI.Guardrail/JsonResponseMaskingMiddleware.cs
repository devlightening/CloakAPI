using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CloakAPI.Data;

namespace CloakAPI.Guardrail;

public sealed class JsonResponseMaskingMiddleware
{
    private readonly RequestDelegate _next;

    public JsonResponseMaskingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, JsonMaskingService jsonMaskingService, IAuditWriter auditWriter)
    {
        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;
        var role = context.User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var subjectUserId = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                            ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? string.Empty;

        var decision = "Allow";
        var maskedCount = 0;
        IReadOnlyCollection<string> piiTypesFound = Array.Empty<string>();
        IReadOnlyCollection<string> maskedFields = Array.Empty<string>();
        var statusCode = 0;

        try
        {
            await _next(context);

            buffer.Position = 0;

            var contentType = context.Response.ContentType;
            var isJson = !string.IsNullOrWhiteSpace(contentType) &&
                         contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase);
            var shouldMask = isJson && string.Equals(role, "Analyst", StringComparison.OrdinalIgnoreCase);

            statusCode = context.Response.StatusCode;

            if (!shouldMask)
            {
                await buffer.CopyToAsync(originalBody);

                var auditEvent = new AuditEvent
                {
                    Id = Guid.NewGuid(),
                    TimestampUtc = DateTime.UtcNow,
                    SubjectUserId = subjectUserId,
                    Role = role,
                    Method = method,
                    Endpoint = path,
                    Decision = decision,
                    MaskedCount = maskedCount,
                    StatusCode = statusCode
                };

                auditEvent.SetPiiTypesFound(piiTypesFound);
                auditEvent.SetMaskedFields(maskedFields);

                await auditWriter.WriteAsync(auditEvent, context.RequestAborted);
                return;
            }

            using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
            var bodyText = await reader.ReadToEndAsync();

            var (masked, report) = jsonMaskingService.MaskJson(bodyText);

            maskedCount = report.MaskedCount;
            piiTypesFound = report.PiiTypesFound;
            maskedFields = report.MaskedFields;
            decision = maskedCount > 0 ? "Mask" : "Allow";

            context.Response.Headers.ContentLength = null;
            context.Response.Body = originalBody;
            await context.Response.WriteAsync(masked, Encoding.UTF8);

            var auditEventMasked = new AuditEvent
            {
                Id = Guid.NewGuid(),
                TimestampUtc = DateTime.UtcNow,
                SubjectUserId = subjectUserId,
                Role = role,
                Method = method,
                Endpoint = path,
                Decision = decision,
                MaskedCount = maskedCount,
                StatusCode = statusCode
            };

            auditEventMasked.SetPiiTypesFound(piiTypesFound);
            auditEventMasked.SetMaskedFields(maskedFields);

            await auditWriter.WriteAsync(auditEventMasked, context.RequestAborted);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }
}
