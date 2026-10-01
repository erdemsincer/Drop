import { apiClient } from '@/api/apiClient';

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { accessToken: string; expiresIn: number; refreshToken: string };
export type RegisterRequest = { email: string; password: string; firstName: string; lastName: string };
export type RegisterResponse = { userId: string; email: string };

export const login = async (request: LoginRequest) => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', request);
  return response.data;
};

export const register = async (request: RegisterRequest) => {
  const response = await apiClient.post<RegisterResponse>('/api/auth/register', request);
  return response.data;
};

export const logout = async (refreshToken: string) => {
  await apiClient.post('/api/auth/logout', { refreshToken });
};

export const requestPasswordReset = async (email: string) => {
  await apiClient.post('/api/auth/forgot-password', { email });
};

export const resetPassword = async (request: { email: string; code: string; newPassword: string }) => {
  await apiClient.post('/api/auth/reset-password', request);
};

export type ExternalSignInRequest = { idToken: string; firstName?: string | null; lastName?: string | null };

/** Apple or Google identity token in, a Drop session out (the account is created or linked as needed). */
export const signInWithProvider = async (provider: 'apple' | 'google', request: ExternalSignInRequest) => {
  const response = await apiClient.post<LoginResponse>(`/api/auth/${provider}`, request);
  return response.data;
};
