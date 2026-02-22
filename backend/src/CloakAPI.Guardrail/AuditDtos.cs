namespace CloakAPI.Guardrail;

public sealed record AuditEventDto(
    Guid Id,
    DateTime TimestampUtc,
    string SubjectUserId,
    string Role,
    string Method,
    string Endpoint,
    string Decision,
    int MaskedCount,
    string[] PiiTypesFound,
    string[] MaskedFields,
    int StatusCode);
