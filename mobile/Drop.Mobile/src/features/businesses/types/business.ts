export type BusinessRole = 'Owner' | 'Manager' | 'Staff';

export type BusinessStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';

export type MyBusiness = {
  id: string;
  name: string;
  role: BusinessRole;
  branchCount: number;
  status: BusinessStatus;
  statusReason?: string | null;
};

export type Branch = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activeDropCount: number;
};

export type BranchDetail = {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
  latitude: number;
  longitude: number;
  role: BusinessRole;
  canManage: boolean;
  canShowQr: boolean;
  businessStatus: BusinessStatus;
  /** Manager/owner of an approved business. */
  canPublishDrops: boolean;
};

export type BusinessMember = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BusinessRole;
  isCurrentUser: boolean;
  canRemove: boolean;
};

export type AddMemberRequest = {
  email: string;
  role: Exclude<BusinessRole, 'Owner'>;
};

export type DropStatus = 'Draft' | 'Active' | 'Expired' | 'Cancelled' | 'Scheduled';

export type BusinessDrop = {
  id: string;
  title: string;
  description?: string | null;
  minimumSpend?: number | null;
  capacity: number;
  activeClaimCount: number;
  redeemedCount: number;
  remainingCapacity: number;
  durationMinutes: number;
  claimDurationMinutes: number;
  status: DropStatus;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type CreateBusinessRequest = {
  name: string;
};

export type CreateBusinessResponse = {
  id: string;
  name: string;
  status: BusinessStatus;
};

export type CreateBranchRequest = {
  name: string;
  latitude: number;
  longitude: number;
};

export type CreateBranchResponse = {
  id: string;
  businessId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type CreateDropRequest = {
  title: string;
  description?: string | null;
  minimumSpend?: number | null;
  capacity: number;
  durationMinutes: number;
  claimDurationMinutes: number;
  /** ISO time; omit or null to publish immediately. */
  startsAt?: string | null;
};

export type UpdateDropRequest = {
  title: string;
  description?: string | null;
  minimumSpend?: number | null;
  capacity: number;
};

export type UpdateBranchRequest = {
  name: string;
  latitude?: number;
  longitude?: number;
};

export type CreateDropResponse = {
  id: string;
  branchId: string;
  title: string;
  capacity: number;
  startsAt: string;
  endsAt: string;
};

export type DropLifecycleResponse = {
  id: string;
  status: DropStatus;
  endsAt?: string | null;
  activeClaimCount: number;
  releasedClaimCount: number;
};

export type BranchQrCode = {
  /** Short-lived secret: render it as a QR only, never as text or in logs. */
  payload: string;
  refreshAt: string;
  periodSeconds: number;
};
