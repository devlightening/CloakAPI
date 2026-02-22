using CloakAPI.Data;

namespace CloakAPI.Guardrail;

public interface IAuditWriter
{
    Task WriteAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default);
}

public sealed class AuditWriter : IAuditWriter
{
    private readonly CloakDbContext _db;

    public AuditWriter(CloakDbContext db)
    {
        _db = db;
    }

    public async Task WriteAsync(AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        _db.AuditEvents.Add(auditEvent);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
