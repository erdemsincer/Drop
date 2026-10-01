using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RecurringDrops : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ScheduleId",
                table: "drops",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "drop_schedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    MinimumSpend = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    ClaimDuration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    OriginalPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    DealPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PhotoId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    Days = table.Column<int>(type: "integer", nullable: false),
                    IsPaused = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastOccurrenceAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_drop_schedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_drop_schedules_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_drop_schedules_media_files_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "media_files",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_drops_ScheduleId",
                table: "drops",
                column: "ScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_drop_schedules_BranchId",
                table: "drop_schedules",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_drop_schedules_PhotoId",
                table: "drop_schedules",
                column: "PhotoId");

            migrationBuilder.AddForeignKey(
                name: "FK_drops_drop_schedules_ScheduleId",
                table: "drops",
                column: "ScheduleId",
                principalTable: "drop_schedules",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_drops_drop_schedules_ScheduleId",
                table: "drops");

            migrationBuilder.DropTable(
                name: "drop_schedules");

            migrationBuilder.DropIndex(
                name: "IX_drops_ScheduleId",
                table: "drops");

            migrationBuilder.DropColumn(
                name: "ScheduleId",
                table: "drops");
        }
    }
}
