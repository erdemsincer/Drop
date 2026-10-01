using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalLogins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.CreateTable(
                name: "external_logins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_external_logins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_external_logins_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_external_logins_Provider_Subject",
                table: "external_logins",
                columns: new[] { "Provider", "Subject" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_external_logins_UserId_Provider",
                table: "external_logins",
                columns: new[] { "UserId", "Provider" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "external_logins");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
