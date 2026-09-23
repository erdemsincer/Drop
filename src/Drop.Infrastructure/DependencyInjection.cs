using Drop.Application.Abstractions;
using Drop.Application.Authentication;
using Drop.Application.Authentication.Login;
using Drop.Application.Authentication.Register;
using Drop.Application.Businesses;
using Drop.Application.Businesses.CreateBusiness;
using Drop.Application.Businesses.GetMyBusinesses;
using Drop.Application.Branches;
using Drop.Application.Branches.CreateBranch;
using Drop.Application.Branches.GetBranch;
using Drop.Application.Branches.GetBranches;
using Drop.Application.BranchQrTokens.Create;
using Drop.Application.Claims;
using Drop.Application.Claims.CreateClaim;
using Drop.Application.Claims.RedeemClaim;
using Drop.Application.Drops;
using Drop.Application.Drops.CreateDrop;
using Drop.Application.Drops.GetBranchDrops;
using Drop.Application.Drops.GetNearbyDrops;
using Drop.Application.Features.Claims.ActiveClaim;
using Drop.Application.Features.Drops.GetDropDetail;
using Drop.Application.Security;
using Drop.Application.Users;
using Drop.Infrastructure.Authentication;
using Drop.Infrastructure.Businesses;
using Drop.Infrastructure.Claims;
using Drop.Infrastructure.Persistence;
using Drop.Infrastructure.Queries;
using Drop.Infrastructure.Repositories;
using Drop.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Drop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException(
                "Database connection string was not found.");

        services.AddDbContext<DropDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                npgsqlOptions =>
                    npgsqlOptions.UseNetTopologySuite()));

        services.AddHealthChecks()
            .AddNpgSql(
                connectionString,
                name: "postgresql",
                tags: ["ready"]);

        services.AddScoped<IUnitOfWork>(
            sp => sp.GetRequiredService<DropDbContext>());

        services.AddScoped<IBusinessRepository, BusinessRepository>();
        services.AddScoped<CreateBusinessService>();

        services.AddScoped<IBranchRepository, BranchRepository>();
        services.AddScoped<CreateBranchService>();

        services.AddScoped<IBranchQrTokenRepository, BranchQrTokenRepository>();
        services.AddScoped<IQrTokenGenerator, QrTokenGenerator>();
        services.AddScoped<CreateBranchQrTokenService>();

        services.AddScoped<IDropRepository, DropRepository>();
        services.AddScoped<CreateDropService>();

        services.AddScoped<INearbyDropQuery, NearbyDropQuery>();
        services.AddScoped<GetNearbyDropsService>();

        services.AddScoped<IDropDetailQuery, DropDetailQuery>();
        services.AddScoped<GetDropDetailService>();

        services.AddScoped<IActiveClaimQuery, ActiveClaimQuery>();
        services.AddScoped<GetActiveClaimService>();

        services.AddScoped<IClaimStore, ClaimStore>();
        services.AddScoped<CreateClaimService>();

        services.AddScoped<IMyBusinessesQuery, MyBusinessesQuery>();
        services.AddScoped<GetMyBusinessesService>();

        services.AddScoped<IBranchListQuery, BranchListQuery>();
        services.AddScoped<GetBranchesService>();

        services.AddScoped<IBranchDetailQuery, BranchDetailQuery>();
        services.AddScoped<GetBranchService>();

        services.AddScoped<IBranchDropsQuery, BranchDropsQuery>();
        services.AddScoped<GetBranchDropsService>();

        services.AddScoped<IRedemptionStore, RedemptionStore>();
        services.AddScoped<RedeemClaimService>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenProvider, JwtTokenProvider>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<IBusinessMemberRepository, BusinessMemberRepository>();
        services.AddScoped<IBusinessAccessService, BusinessAccessService>();

        services.AddScoped<RegisterService>();
        services.AddScoped<LoginService>();

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(
            opt =>
            {
                opt.Issuer = jwtSection["Issuer"]!;
                opt.Audience = jwtSection["Audience"]!;
                opt.Key = jwtSection["Key"]!;
            });

        services.AddSingleton(TimeProvider.System);

        return services;
    }
}

