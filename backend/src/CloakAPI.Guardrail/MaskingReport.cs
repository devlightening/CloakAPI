namespace CloakAPI.Guardrail;

public sealed record MaskingReport(
    int MaskedCount,
    IReadOnlyCollection<string> PiiTypesFound,
    IReadOnlyCollection<string> MaskedFields);
