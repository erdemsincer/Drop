using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CreatedAt",
                table: "businesses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "businesses",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "StatusChangedAt",
                table: "businesses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "StatusReason",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            // Businesses created before verification existed were already trusted in the
            // pilot: mark them Approved. Then drop the temporary column defaults so every
            // new row gets its status from the application (Pending).
            migrationBuilder.Sql(
                """
                UPDATE businesses
                SET "Status" = 'Approved', "CreatedAt" = now(), "StatusChangedAt" = now()
                WHERE "Status" = '';

                ALTER TABLE businesses ALTER COLUMN "Status" DROP DEFAULT;
                ALTER TABLE businesses ALTER COLUMN "CreatedAt" DROP DEFAULT;
                ALTER TABLE businesses ALTER COLUMN "StatusChangedAt" DROP DEFAULT;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_businesses_Status",
                table: "businesses",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_businesses_Status",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "StatusChangedAt",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "StatusReason",
                table: "businesses");
        }
    }
}
