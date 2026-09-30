using Drop.Api.Configuration;
using FluentAssertions;
using Npgsql;

namespace Drop.IntegrationTests.Configuration;

public sealed class PlatformConfigurationTests
{
    [Fact]
    public void DatabaseUrl_ShouldConvert_ToNpgsqlConnectionString()
    {
        var connectionString = PlatformConfiguration.ToNpgsqlConnectionString(
            "postgresql://postgres:s3cr%3Bt%22pw@db.internal:6543/railway");

        var parsed = new NpgsqlConnectionStringBuilder(connectionString);

        parsed.Host.Should().Be("db.internal");
        parsed.Port.Should().Be(6543);
        parsed.Database.Should().Be("railway");
        parsed.Username.Should().Be("postgres");
        parsed.Password.Should().Be("s3cr;t\"pw");
        parsed.SslMode.Should().Be(SslMode.Prefer);
    }

    [Fact]
    public void DatabaseUrl_ShouldDefaultPort_WhenMissing()
    {
        var parsed = new NpgsqlConnectionStringBuilder(
            PlatformConfiguration.ToNpgsqlConnectionString("postgres://drop:pw@localhost/dropdb"));

        parsed.Port.Should().Be(5432);
    }
}
