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
};

export type RedeemClaimRequest = {
  qrToken: string;
};

export type RedeemClaimResponse = {
  claimId: string;
  dropId: string;
  redeemedAt: string;
};
