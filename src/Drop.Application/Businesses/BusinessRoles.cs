using Drop.Domain.Businesses;

namespace Drop.Application.Businesses;

public static class BusinessRoles
{
    /// <summary>Owner and Manager may create branches, drops and QR tokens; Staff may only view.</summary>
    public static bool CanManage(BusinessMemberRole? role) =>
        role is BusinessMemberRole.Owner or BusinessMemberRole.Manager;

    /// <summary>Every member may show the branch QR: that is the cashier's job.</summary>
    public static bool CanShowQr(BusinessMemberRole? role) => role is not null;

    /// <summary>Owners manage managers and staff; managers manage staff. Nobody manages the owner.</summary>
    public static bool CanManageMember(BusinessMemberRole actor, BusinessMemberRole target) =>
        target != BusinessMemberRole.Owner &&
        (actor == BusinessMemberRole.Owner ||
         (actor == BusinessMemberRole.Manager && target == BusinessMemberRole.Staff));
}
