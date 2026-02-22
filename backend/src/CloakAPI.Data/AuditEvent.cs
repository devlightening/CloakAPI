using System.Text.Json;

namespace CloakAPI.Data;

public sealed class AuditEvent
{
    public Guid Id { get; set; }
    public DateTime TimestampUtc { get; set; }

    public string SubjectUserId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    public string Method { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;

    public string Decision { get; set; } = string.Empty; // Allow|Mask
    public int MaskedCount { get; set; }

    public string PiiTypesFoundJson { get; set; } = "[]";
    public string MaskedFieldsJson { get; set; } = "[]";

    public int StatusCode { get; set; }

    public void SetPiiTypesFound(IEnumerable<string> piiTypes)
    {
        PiiTypesFoundJson = JsonSerializer.Serialize(piiTypes.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    public void SetMaskedFields(IEnumerable<string> maskedFields)
    {
        MaskedFieldsJson = JsonSerializer.Serialize(maskedFields.Distinct(StringComparer.OrdinalIgnoreCase));
    }
}
