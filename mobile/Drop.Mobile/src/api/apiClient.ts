import { create, isAxiosError } from 'axios';
import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';
import { authStorage } from '@/storage/authStorage';

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Correlation-ID'] = Crypto.randomUUID();
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      await authStorage.removeAccessToken();
    }
    return Promise.reject(error);
  },
);
