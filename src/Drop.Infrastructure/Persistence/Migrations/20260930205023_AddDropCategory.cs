using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDropCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "drops",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                // Existing drops predate categories.
                defaultValue: "Other");

            migrationBuilder.CreateIndex(
                name: "IX_drops_Category",
                table: "drops",
                column: "Category");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_drops_Category",
                table: "drops");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "drops");
        }
    }
}
