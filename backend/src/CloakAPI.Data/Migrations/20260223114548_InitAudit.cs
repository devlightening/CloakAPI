using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloakAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubjectUserId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Method = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Decision = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    MaskedCount = table.Column<int>(type: "integer", nullable: false),
                    pii_types_found = table.Column<string>(type: "jsonb", nullable: false),
                    masked_fields = table.Column<string>(type: "jsonb", nullable: false),
                    StatusCode = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_events", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_SubjectUserId",
                table: "audit_events",
                column: "SubjectUserId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_TimestampUtc",
                table: "audit_events",
                column: "TimestampUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_events");
        }
    }
}
