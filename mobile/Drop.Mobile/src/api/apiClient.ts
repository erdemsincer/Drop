import axios, { type AxiosRequestConfig, create, isAxiosError } from 'axios';
import * as Crypto from 'expo-crypto';

import { env } from '@/config/env';
import { authStorage, type Session } from '@/storage/authStorage';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

// AuthProvider registers this so an unrecoverable session logs the user out
// instead of leaving the UI "signed in" with no valid token.
export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Endpoints where a 401 means "bad credentials", not "expired access token".
const NO_REFRESH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'];

type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

let refreshInFlight: Promise<Session | null> | null = null;

/**
 * Exchanges the stored refresh token for a new pair. Concurrent 401s share one
 * call: the server rotates tokens and treats reuse of a rotated token as theft,
 * so parallel refreshes would log the user out.
 */
export const refreshSession = (): Promise<Session | null> => {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) return null;

      // Plain axios: must not pass through this client's interceptors.
      const response = await axios.post<Session>(
        `${env.apiUrl}/api/auth/refresh`,
        { refreshToken },
        { timeout: 10_000 },
      );

      await authStorage.setSession(response.data);
      return response.data;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

apiClient.interceptors.request.use(async config => {
  const token = await authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Correlation-ID'] = Crypto.randomUUID();
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const config = error.config as RetriableConfig;
    const skip = NO_REFRESH_PATHS.some(path => config.url?.includes(path));

    if (skip || config._retried) {
      return Promise.reject(error);
    }

    const session = await refreshSession();

    if (!session) {
      await authStorage.clear();
      unauthorizedHandler?.();
      return Promise.reject(error);
    }

    config._retried = true;
    config.headers = { ...config.headers, Authorization: `Bearer ${session.accessToken}` };
    return apiClient.request(config);
  },
);
