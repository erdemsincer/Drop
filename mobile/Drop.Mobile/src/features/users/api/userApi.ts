import { apiClient } from '@/api/apiClient';
import type { Session } from '@/storage/authStorage';

export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  isAdmin: boolean;
  /** False for Apple/Google accounts that never set a password. */
  hasPassword: boolean;
};

export const getMe = async () => {
  const response = await apiClient.get<Me>('/api/users/me');
  return response.data;
};

export const updateProfile = async (request: { firstName: string; lastName: string }) => {
  const response = await apiClient.put<Me>('/api/users/me', request);
  return response.data;
};

/** Changes the password; other devices are signed out and this one gets a fresh session. */
export const changePassword = async (request: { currentPassword: string; newPassword: string }) => {
  const response = await apiClient.post<Session>('/api/users/me/password', request);
  return response.data;
};

export const verifyEmail = async (code: string) => {
  await apiClient.post('/api/users/me/email/verify', { code });
};

/** Sends a new code; the server sends at most one per minute. */
export const resendVerification = async () => {
  await apiClient.post('/api/users/me/email/resend');
};

/** Permanently deletes the account (and businesses the user owns). */
/** `password` is null for accounts without one (Apple/Google sign-in). */
export const deleteAccount = async (password: string | null) => {
  await apiClient.post('/api/users/me/delete', { password });
};
