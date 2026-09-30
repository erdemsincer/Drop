using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AccountVerificationAndBranchClosing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Reset codes live 15 minutes; replacing the table only voids codes in flight.
            migrationBuilder.DropTable(
                name: "password_reset_codes");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmailVerifiedAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            // Accounts from before verification existed are trusted as they are,
            // so their businesses don't get stuck waiting for a code.
            migrationBuilder.Sql("""UPDATE users SET "EmailVerifiedAt" = "CreatedAt";""");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ClosedAt",
                table: "branches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "verification_codes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    UsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verification_codes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_verification_codes_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_verification_codes_UserId_Purpose_CreatedAt",
                table: "verification_codes",
                columns: new[] { "UserId", "Purpose", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "verification_codes");

            migrationBuilder.DropColumn(
                name: "EmailVerifiedAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "branches");

            migrationBuilder.CreateTable(
                name: "password_reset_codes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_codes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_password_reset_codes_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_codes_UserId_CreatedAt",
                table: "password_reset_codes",
                columns: new[] { "UserId", "CreatedAt" });
        }
    }
}
