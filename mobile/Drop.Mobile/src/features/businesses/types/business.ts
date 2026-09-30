import type { DropCategory } from '@/features/drops/utils/categories';

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
  isClosed: boolean;
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
  /** Closed branches can't publish until reopened. */
  isClosed: boolean;
  /** Manager/owner of an approved business, and the branch is open. */
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
  category: DropCategory;
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
  category: DropCategory;
};

export type UpdateDropRequest = {
  title: string;
  description?: string | null;
  minimumSpend?: number | null;
  capacity: number;
  category?: DropCategory;
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

export type BusinessStats = {
  days: number;
  dropsPublished: number;
  reservations: number;
  redemptions: number;
  /** 0–1: share of the period's reservations that were used. */
  redemptionRate: number;
  uniqueCustomers: number;
  returningCustomers: number;
  daily: { date: string; reservations: number; redemptions: number }[];
  topDrops: { dropId: string; title: string; branchName: string; reservations: number; redemptions: number }[];
  branches: { branchId: string; name: string; redemptions: number }[];
};
