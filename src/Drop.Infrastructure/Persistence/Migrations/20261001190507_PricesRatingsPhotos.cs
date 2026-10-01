using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PricesRatingsPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DealPrice",
                table: "drops",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalPrice",
                table: "drops",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PhotoId",
                table: "drops",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RatedAt",
                table: "claims",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "claims",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "media_files",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Content = table.Column<byte[]>(type: "bytea", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_media_files", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_drops_PhotoId",
                table: "drops",
                column: "PhotoId");

            migrationBuilder.AddForeignKey(
                name: "FK_drops_media_files_PhotoId",
                table: "drops",
                column: "PhotoId",
                principalTable: "media_files",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_drops_media_files_PhotoId",
                table: "drops");

            migrationBuilder.DropTable(
                name: "media_files");

            migrationBuilder.DropIndex(
                name: "IX_drops_PhotoId",
                table: "drops");

            migrationBuilder.DropColumn(
                name: "DealPrice",
                table: "drops");

            migrationBuilder.DropColumn(
                name: "OriginalPrice",
                table: "drops");

            migrationBuilder.DropColumn(
                name: "PhotoId",
                table: "drops");

            migrationBuilder.DropColumn(
                name: "RatedAt",
                table: "claims");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "claims");
        }
    }
}
