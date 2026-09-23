using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClaimDurationMinutesColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClaimDurationMinutes",
                table: "drops",
                type: "integer",
                nullable: false,
                defaultValue: 15);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClaimDurationMinutes",
                table: "drops");
        }
    }
}