using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Drop.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSpatialLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Try to create PostGIS extension via raw SQL for better control
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    CREATE EXTENSION IF NOT EXISTS postgis;
                EXCEPTION WHEN OTHERS THEN
                    -- PostGIS not available - continue without spatial features
                    NULL;
                END $$;
                """);

            // Try to add spatial columns, but gracefully skip if PostGIS is not available
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
                        ALTER TABLE branches
                        ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
                        GENERATED ALWAYS AS (
                            ST_SetSRID(
                                ST_MakePoint("Longitude", "Latitude"),
                                4326
                            )::geography
                        ) STORED;
                    END IF;
                END $$;
                """);

            // Create spatial index only if PostGIS exists
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
                        CREATE INDEX IF NOT EXISTS ix_branches_location
                        ON branches
                        USING GIST (location);
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop spatial index if it exists
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
                        DROP INDEX IF EXISTS ix_branches_location;
                    END IF;
                END $$;
                """);

            // Drop location column if it exists
            migrationBuilder.Sql(
                """
                ALTER TABLE branches
                DROP COLUMN IF EXISTS location;
                """);

            // Note: We're not dropping the PostGIS extension to avoid affecting other tables
            // that might depend on it
        }
    }
}
