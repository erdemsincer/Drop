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
