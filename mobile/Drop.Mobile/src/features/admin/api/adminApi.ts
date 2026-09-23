import { apiClient } from '@/api/apiClient';
import type { BusinessStatus } from '@/features/businesses/types/business';

export type AdminBusiness = {
  id: string;
  name: string;
  status: BusinessStatus;
  statusReason?: string | null;
  createdAt: string;
  statusChangedAt: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  branchCount: number;
};

export type ModerationAction = 'approve' | 'reject' | 'suspend';

export const getAdminBusinesses = async (status: BusinessStatus) => {
  const response = await apiClient.get<AdminBusiness[]>('/api/admin/businesses', { params: { status } });
  return response.data;
};

export const moderateBusiness = async (businessId: string, action: ModerationAction, reason?: string) => {
  const response = await apiClient.post<AdminBusiness>(
    `/api/admin/businesses/${businessId}/${action}`,
    action === 'approve' ? undefined : { reason },
  );
  return response.data;
};
