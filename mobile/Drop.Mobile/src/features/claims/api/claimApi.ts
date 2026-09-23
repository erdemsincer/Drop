import { apiClient } from '@/api/apiClient';

import type {
  ActiveClaim,
  CreateClaimResponse,
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
