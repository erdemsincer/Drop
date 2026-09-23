using Drop.Domain.Businesses;

namespace Drop.Application.Businesses;

public static class BusinessRoles
{
    /// <summary>Owner and Manager may create branches, drops and QR tokens; Staff may only view.</summary>
    public static bool CanManage(BusinessMemberRole? role) =>
        role is BusinessMemberRole.Owner or BusinessMemberRole.Manager;
}
