import { apiClient } from '@/api/apiClient';

import type {
  AddMemberRequest,
  Branch,
  BranchDetail,
  BranchQrCode,
  BusinessDrop,
  BusinessMember,
  BusinessStats,
  CreateBranchRequest,
  CreateBranchResponse,
  CreateBusinessRequest,
  CreateBusinessResponse,
  CreateDropRequest,
  CreateDropResponse,
  DropLifecycleResponse,
  MyBusiness,
  UpdateBranchRequest,
  UpdateDropRequest,
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

// The branch's current rotating QR code; fetch again at refreshAt.
export const getBranchQr = async (branchId: string) => {
  const response = await apiClient.get<BranchQrCode>(`/api/branches/${branchId}/qr`);
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

export const getMembers = async (businessId: string) => {
  const response = await apiClient.get<BusinessMember[]>(`/api/businesses/${businessId}/members`);
  return response.data;
};

export const addMember = async (businessId: string, request: AddMemberRequest) => {
  const response = await apiClient.post<BusinessMember>(`/api/businesses/${businessId}/members`, request);
  return response.data;
};

export const removeMember = async (businessId: string, userId: string) => {
  await apiClient.delete(`/api/businesses/${businessId}/members/${userId}`);
};

export const updateDrop = async (dropId: string, request: UpdateDropRequest) => {
  const response = await apiClient.put<DropLifecycleResponse>(`/api/drops/${dropId}`, request);
  return response.data;
};

export const updateBranch = async (branchId: string, request: UpdateBranchRequest) => {
  const response = await apiClient.put<CreateBranchResponse>(`/api/branches/${branchId}`, request);
  return response.data;
};

/** Cancels the branch's live and scheduled drops and blocks publishing until reopened. */
export const closeBranch = async (branchId: string) => {
  await apiClient.post(`/api/branches/${branchId}/close`);
};

export const reopenBranch = async (branchId: string) => {
  await apiClient.post(`/api/branches/${branchId}/reopen`);
};

/** Owner only. */
export const renameBusiness = async (businessId: string, name: string) => {
  const response = await apiClient.put<{ id: string; name: string }>(`/api/businesses/${businessId}`, { name });
  return response.data;
};

export const getBusinessStats = async (businessId: string, days: number) => {
  const response = await apiClient.get<BusinessStats>(`/api/businesses/${businessId}/stats`, { params: { days } });
  return response.data;
};
