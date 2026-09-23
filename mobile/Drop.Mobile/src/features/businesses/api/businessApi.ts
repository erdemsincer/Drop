import { apiClient } from '@/api/apiClient';

import type {
  AddMemberRequest,
  Branch,
  BranchDetail,
  BranchQrCode,
  BusinessDrop,
  BusinessMember,
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
