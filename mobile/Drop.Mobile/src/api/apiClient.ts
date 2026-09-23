import { create, isAxiosError } from 'axios';
import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';
import { authStorage } from '@/storage/authStorage';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

// AuthProvider registers this so a rejected/expired token logs the user out
// instead of leaving the UI "signed in" with no token.
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

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
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);
