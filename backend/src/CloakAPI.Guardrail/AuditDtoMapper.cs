using System.Text.Json;
using CloakAPI.Data;

namespace CloakAPI.Guardrail;

public static class AuditDtoMapper
{
    public static AuditEventDto ToDto(AuditEvent e)
    {
        return new AuditEventDto(
            e.Id,
            e.TimestampUtc,
            e.SubjectUserId,
            e.Role,
            e.Method,
            e.Endpoint,
            e.Decision,
            e.MaskedCount,
            TryParseStringArray(e.PiiTypesFoundJson),
            TryParseStringArray(e.MaskedFieldsJson),
            e.StatusCode);
    }

    private static string[] TryParseStringArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<string>();
        try
        {
            return JsonSerializer.Deserialize<string[]>(json) ?? Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }
}
