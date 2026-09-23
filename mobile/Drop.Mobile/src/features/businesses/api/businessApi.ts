import { apiClient } from '@/api/apiClient';

import type {
  Branch,
  BranchDetail,
  BranchQrTokenResponse,
  BusinessDrop,
  CreateBranchRequest,
  CreateBranchResponse,
  CreateBusinessRequest,
  CreateBusinessResponse,
  CreateDropRequest,
  CreateDropResponse,
  DropLifecycleResponse,
  MyBusiness,
} from '../types/business';

export const getMyBusinesses = async () => {
  const response = await apiClient.get<MyBusiness[]>('/api/businesses/me');
  return response.data;
};

export const createBusiness = async (request: CreateBusinessRequest) => {
  const response = await apiClient.post<CreateBusinessResponse>('/api/businesses', request);
  return response.data;
};

export const getBranches = async (businessId: string) => {
  const response = await apiClient.get<Branch[]>(`/api/businesses/${businessId}/branches`);
  return response.data;
};

export const createBranch = async (businessId: string, request: CreateBranchRequest) => {
  const response = await apiClient.post<CreateBranchResponse>(
    `/api/businesses/${businessId}/branches`,
    request,
  );
  return response.data;
};

export const getBranch = async (branchId: string) => {
  const response = await apiClient.get<BranchDetail>(`/api/branches/${branchId}`);
  return response.data;
};

export const getBranchDrops = async (branchId: string) => {
  const response = await apiClient.get<BusinessDrop[]>(`/api/branches/${branchId}/drops`);
  return response.data;
};

export const createDrop = async (branchId: string, request: CreateDropRequest) => {
  const response = await apiClient.post<CreateDropResponse>(`/api/branches/${branchId}/drops`, request);
  return response.data;
};

// Rotates the branch QR: the previous token is revoked server-side.
// The raw token must only ever be rendered as a QR, never logged or shown as text.
export const createBranchQrToken = async (branchId: string) => {
  const response = await apiClient.post<BranchQrTokenResponse>(`/api/branches/${branchId}/qr-token`);
  return response.data;
};

export const endDrop = async (dropId: string) => {
  const response = await apiClient.post<DropLifecycleResponse>(`/api/drops/${dropId}/end`);
  return response.data;
};

export const cancelDrop = async (dropId: string) => {
  const response = await apiClient.post<DropLifecycleResponse>(`/api/drops/${dropId}/cancel`);
  return response.data;
};
