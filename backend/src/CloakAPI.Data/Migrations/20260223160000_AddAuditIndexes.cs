using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloakAPI.Data.Migrations;

[Migration("20260223160000_AddAuditIndexes")]
public partial class AddAuditIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_audit_events_TimestampUtc\" ON \"audit_events\" (\"TimestampUtc\");");
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_audit_events_Role\" ON \"audit_events\" (\"Role\");");
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_audit_events_Decision\" ON \"audit_events\" (\"Decision\");");
        migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_audit_events_Endpoint\" ON \"audit_events\" (\"Endpoint\");");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_audit_events_TimestampUtc\";");
        migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_audit_events_Role\";");
        migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_audit_events_Decision\";");
        migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_audit_events_Endpoint\";");
    }
}
