using Drop.Application.Businesses.Stats;
using Drop.Application.Branches.BranchLifecycle;
using Drop.Application.Businesses.RenameBusiness;
using Drop.Infrastructure.Branches;
using Drop.Application.Users.ChangePassword;
using Drop.Application.Users.EmailVerification;
using Drop.Application.Users.UpdateProfile;
using Drop.Application.Claims.CancelClaim;
using Drop.Application.Abstractions;
using Drop.Application.Admin;
using Drop.Application.Authentication;
using Drop.Application.Authentication.Login;
using Drop.Application.Authentication.Logout;
using Drop.Application.Authentication.PasswordReset;
using Drop.Application.Authentication.Refresh;
using Drop.Application.Authentication.Register;
using Drop.Application.Businesses;
using Drop.Application.Businesses.CreateBusiness;
using Drop.Application.Businesses.GetMyBusinesses;
using Drop.Application.Businesses.Members;
using Drop.Application.Branches;
using Drop.Application.Branches.CreateBranch;
using Drop.Application.Branches.GetBranch;
using Drop.Application.Branches.GetBranchQr;
using Drop.Application.Branches.UpdateBranch;
using Drop.Application.Branches.GetBranches;
using Drop.Application.Claims;
using Drop.Application.Claims.CreateClaim;
using Drop.Application.Claims.MyClaims;
using Drop.Application.Claims.RedeemClaim;
using Drop.Application.Drops;
using Drop.Application.Notifications;
using Drop.Application.Drops.CreateDrop;
using Drop.Application.Drops.GetBranchDrops;
using Drop.Application.Drops.ManageDrop;
using Drop.Application.Drops.GetNearbyDrops;
using Drop.Application.Features.Claims.ActiveClaim;
using Drop.Application.Features.Drops.GetDropDetail;
using Drop.Application.Security;
using Drop.Application.Users;
using Drop.Application.Users.DeleteAccount;
using Drop.Application.Users.Me;
using Drop.Infrastructure.Admin;
using Drop.Infrastructure.Authentication;
using Drop.Infrastructure.BackgroundJobs;
using Drop.Infrastructure.Businesses;
using Drop.Infrastructure.Claims;
using Drop.Infrastructure.Drops;
using Drop.Infrastructure.Notifications;
using Drop.Infrastructure.Persistence;
using Drop.Infrastructure.Queries;
using Drop.Infrastructure.Repositories;
using Drop.Infrastructure.Security;
using Drop.Infrastructure.Users;
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
        services.AddScoped<UpdateBranchService>();

        var qrSection = configuration.GetSection(BranchQrCodeOptions.SectionName);
        services.Configure<BranchQrCodeOptions>(
            opt =>
            {
                opt.SigningKey = qrSection["SigningKey"]!;

                if (int.TryParse(qrSection["PeriodSeconds"], out var period))
                    opt.PeriodSeconds = period;

                if (int.TryParse(qrSection["AcceptedPastSteps"], out var pastSteps))
                    opt.AcceptedPastSteps = pastSteps;
            });
        services.AddSingleton<IBranchQrCodeService, BranchQrCodeService>();
        services.AddScoped<GetBranchQrService>();

        services.AddScoped<IDropRepository, DropRepository>();
        services.AddScoped<CreateDropService>();

        services.AddScoped<IDropLifecycleStore, DropLifecycleStore>();
        services.AddScoped<ManageDropService>();

        services.AddScoped<INearbyDropQuery, NearbyDropQuery>();
        services.AddScoped<GetNearbyDropsService>();

        services.AddScoped<IDropDetailQuery, DropDetailQuery>();
        services.AddScoped<GetDropDetailService>();

        services.AddScoped<IMyClaimsQuery, MyClaimsQuery>();
        services.AddScoped<GetMyClaimsService>();
        services.AddScoped<GetMeService>();
        services.AddScoped<IAccountDeletionStore, AccountDeletionStore>();
        services.AddScoped<DeleteAccountService>();
        services.AddScoped<UpdateProfileService>();
        services.AddScoped<ChangePasswordService>();
        services.AddScoped<EmailVerificationService>();

        services.AddScoped<IActiveClaimQuery, ActiveClaimQuery>();
        services.AddScoped<GetActiveClaimService>();

        services.AddScoped<IClaimStore, ClaimStore>();
        services.AddScoped<CreateClaimService>();
        services.AddScoped<CancelClaimService>();

        services.AddScoped<IAdminAccess, ConfiguredAdminAccess>();
        services.AddScoped<IAdminBusinessStore, AdminBusinessStore>();
        services.AddScoped<AdminBusinessesService>();

        services.AddScoped<IBusinessMembersQuery, BusinessMembersQuery>();
        services.AddScoped<BusinessMembersService>();

        services.AddScoped<IMyBusinessesQuery, MyBusinessesQuery>();
        services.AddScoped<GetMyBusinessesService>();

        services.AddScoped<IBranchListQuery, BranchListQuery>();
        services.AddScoped<GetBranchesService>();

        services.AddScoped<IBranchDetailQuery, BranchDetailQuery>();
        services.AddScoped<GetBranchService>();
        services.AddScoped<IBranchLifecycleStore, BranchLifecycleStore>();
        services.AddScoped<BranchLifecycleService>();
        services.AddScoped<RenameBusinessService>();
        services.AddScoped<IBusinessStatsQuery, BusinessStatsQuery>();
        services.AddScoped<BusinessStatsService>();

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
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<RefreshSessionService>();
        services.AddScoped<LogoutService>();
        services.AddScoped<IVerificationCodeStore, VerificationCodeStore>();
        services.AddScoped<PasswordResetService>();

        var emailSection = configuration.GetSection(EmailOptions.SectionName);
        services.Configure<EmailOptions>(
            opt =>
            {
                opt.SmtpHost = emailSection["SmtpHost"];
                opt.SmtpUser = emailSection["SmtpUser"];
                opt.SmtpPassword = emailSection["SmtpPassword"];
                opt.From = emailSection["From"] ?? opt.From;

                if (int.TryParse(emailSection["SmtpPort"], out var port))
                    opt.SmtpPort = port;

                if (bool.TryParse(emailSection["EnableSsl"], out var ssl))
                    opt.EnableSsl = ssl;
            });

        if (string.IsNullOrWhiteSpace(emailSection["SmtpHost"]))
            services.AddSingleton<IEmailSender, DevelopmentEmailSender>();
        else
            services.AddSingleton<IEmailSender, SmtpEmailSender>();

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(
            opt =>
            {
                opt.Issuer = jwtSection["Issuer"]!;
                opt.Audience = jwtSection["Audience"]!;
                opt.Key = jwtSection["Key"]!;

                if (int.TryParse(jwtSection["AccessTokenMinutes"], out var accessMinutes))
                    opt.AccessTokenMinutes = accessMinutes;

                if (int.TryParse(jwtSection["RefreshTokenDays"], out var refreshDays))
                    opt.RefreshTokenDays = refreshDays;
            });

        services.AddSingleton(TimeProvider.System);

        var expirationSection = configuration.GetSection(ExpirationOptions.SectionName);
        services.Configure<ExpirationOptions>(
            opt =>
            {
                if (bool.TryParse(expirationSection["Enabled"], out var enabled))
                    opt.Enabled = enabled;

                if (int.TryParse(expirationSection["IntervalSeconds"], out var interval))
                    opt.IntervalSeconds = interval;
            });
        services.AddScoped<ExpirationSweeper>();
        services.AddHostedService<ExpirationWorker>();

        return services;
    }
}

