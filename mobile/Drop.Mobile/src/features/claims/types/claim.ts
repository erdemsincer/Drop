export type CreateClaimResponse = {
  claimId: string;
  dropId: string;
  expiresAt: string;
  remainingCapacity: number;
};

export type ActiveClaim = {
  claimId: string;
  dropId: string;
  businessName: string;
  branchName: string;
  dropTitle: string;
  expiresAt: string;
  latitude: number;
  longitude: number;
};

export type RedeemClaimRequest = {
  qrToken: string;
};

export type RedeemClaimResponse = {
  claimId: string;
  dropId: string;
  redeemedAt: string;
};

export type ClaimStatus = 'Active' | 'Expired' | 'Redeemed' | 'Cancelled';

export type MyClaim = {
  claimId: string;
  dropId: string;
  dropTitle: string;
  businessName: string;
  branchName: string;
  status: ClaimStatus;
  createdAt: string;
  expiresAt: string;
  redeemedAt?: string | null;
  /** DropCategory name; older servers may omit it. */
  category?: string;
};
