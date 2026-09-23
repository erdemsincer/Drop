import { apiClient } from '@/api/apiClient';

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export const getMe = async () => {
  const response = await apiClient.get<Me>('/api/users/me');
  return response.data;
};

/** Permanently deletes the account (and businesses the user owns). */
export const deleteAccount = async (password: string) => {
  await apiClient.post('/api/users/me/delete', { password });
};
