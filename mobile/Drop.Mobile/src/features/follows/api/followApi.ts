import { apiClient } from '@/api/apiClient';

export type FollowedBusiness = {
  businessId: string;
  name: string;
  followedAt: string;
};

export const getFollows = async () => {
  const response = await apiClient.get<FollowedBusiness[]>('/api/users/me/follows');
  return response.data;
};

export const followBusiness = async (businessId: string) => {
  await apiClient.post(`/api/businesses/${businessId}/follow`);
};

export const unfollowBusiness = async (businessId: string) => {
  await apiClient.delete(`/api/businesses/${businessId}/follow`);
};
