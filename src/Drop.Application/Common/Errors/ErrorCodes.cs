namespace Drop.Application.Common.Errors;

/// <summary>
/// Centralized error codes for all application exceptions.
/// Prevents typos and provides a single source of truth for error codes.
/// These codes are returned to clients for localization and handling.
/// </summary>
public static class ErrorCodes
{
    public static class Auth
    {
        public const string InvalidCredentials = "auth.invalid_credentials";
        public const string EmailExists = "auth.email_exists";
        public const string UserInactive = "auth.user_inactive";
        public const string InvalidRefreshToken = "auth.invalid_refresh_token";
        public const string InvalidResetCode = "auth.invalid_reset_code";
        public const string InvalidVerificationCode = "auth.invalid_verification_code";
        public const string InvalidExternalToken = "auth.invalid_external_token";
        public const string ExternalEmailMissing = "auth.external_email_missing";
    }

    public static class Business
    {
        public const string NotFound = "business.not_found";
        public const string AccessDenied = "business.access_denied";
        public const string NotApproved = "business.not_approved";
        public const string OwnerEmailUnverified = "business.owner_email_unverified";
    }

    public static class Admin
    {
        public const string AccessDenied = "admin.access_denied";
    }

    public static class Member
    {
        public const string UserNotFound = "member.user_not_found";
        public const string AlreadyExists = "member.already_exists";
        public const string NotFound = "member.not_found";
        public const string InvalidRole = "member.invalid_role";
        public const string CannotRemoveOwner = "member.cannot_remove_owner";
    }

    public static class Branch
    {
        public const string NotFound = "branch.not_found";
        public const string Closed = "branch.closed";
    }

    public static class Drop
    {
        public const string NotFound = "drop.not_found";
        public const string NotActive = "drop.not_active";
        public const string SoldOut = "drop.sold_out";
        public const string PhotoNotFound = "drop.photo_not_found";
        public const string Locked = "drop.locked";
    }

    public static class Claim
    {
        public const string NotFound = "claim.not_found";
        public const string AlreadyExists = "claim.already_exists";
        public const string ActiveClaimExists = "claim.active_exists";
        public const string NotActive = "claim.not_active";
        public const string Expired = "claim.expired";
        public const string AccessDenied = "claim.access_denied";
    }

    public static class Qr
    {
        public const string Invalid = "qr.invalid";
    }
}
