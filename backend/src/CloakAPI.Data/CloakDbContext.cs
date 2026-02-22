using Microsoft.EntityFrameworkCore;

namespace CloakAPI.Data;

public sealed class CloakDbContext : DbContext
{
    public CloakDbContext(DbContextOptions<CloakDbContext> options) : base(options)
    {
    }

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.ToTable("audit_events");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.TimestampUtc).IsRequired();
            entity.Property(e => e.SubjectUserId).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Role).HasMaxLength(50).IsRequired();

            entity.Property(e => e.Method).HasMaxLength(16).IsRequired();
            entity.Property(e => e.Endpoint).HasMaxLength(500).IsRequired();

            entity.Property(e => e.Decision).HasMaxLength(10).IsRequired();
            entity.Property(e => e.MaskedCount).IsRequired();

            entity.Property(e => e.PiiTypesFoundJson).HasColumnName("pii_types_found").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.MaskedFieldsJson).HasColumnName("masked_fields").HasColumnType("jsonb").IsRequired();

            entity.Property(e => e.StatusCode).IsRequired();

            entity.HasIndex(e => e.TimestampUtc);
            entity.HasIndex(e => e.SubjectUserId);
        });
    }
}
