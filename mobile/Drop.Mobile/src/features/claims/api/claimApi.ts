import { apiClient } from '@/api/apiClient';

import type {
  ActiveClaim,
  CreateClaimResponse,
  MyClaim,
  RedeemClaimRequest,
  RedeemClaimResponse,
} from '../types/claim';

export const createClaim = async (
  dropId: string,
) => {
  const response =
    await apiClient.post<CreateClaimResponse>(
      `/api/drops/${dropId}/claims`,
    );

  return response.data;
};

export const getActiveClaim = async () => {
  const response =
    await apiClient.get<ActiveClaim | null>(
      '/api/claims/me/active',
    );

  if (response.status === 204) {
    return null;
  }

  return response.data;
};

export const redeemClaim = async (
  claimId: string,
  qrToken: string,
) => {
  const response =
    await apiClient.post<RedeemClaimResponse>(
      `/api/claims/${claimId}/redeem`,
      { qrToken } satisfies RedeemClaimRequest,
    );

  return response.data;
};

export const getMyClaims = async () => {
  const response = await apiClient.get<MyClaim[]>('/api/claims/me');
  return response.data;
};

/** Gives an unused reservation back; the same drop can't be claimed again. */
export const cancelClaim = async (claimId: string) => {
  await apiClient.post(`/api/claims/${claimId}/cancel`);
};
