export type BusinessRole = 'Owner' | 'Manager' | 'Staff';

export type MyBusiness = {
  id: string;
  name: string;
  role: BusinessRole;
  branchCount: number;
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

export type DropStatus = 'Draft' | 'Active' | 'Expired' | 'Cancelled';

export type BusinessDrop = {
  id: string;
  title: string;
  description?: string | null;
  minimumSpend?: number | null;
  capacity: number;
  activeClaimCount: number;
  redeemedCount: number;
  remainingCapacity: number;
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

export type BranchQrTokenResponse = {
  token: string;
};
