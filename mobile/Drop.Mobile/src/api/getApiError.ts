import { isAxiosError } from 'axios';

import type { ApiError } from './apiError';

export const getApiError = (error: unknown): ApiError | null => {
  if (!isAxiosError(error) || !error.response?.data) return null;

  const apiError = error.response.data as ApiError;

  // Rate limiting can hit any screen; give it one consistent, friendly message.
  if (apiError.code === 'rate_limit.exceeded') {
    const retryAfter = Number(error.response.headers['retry-after']) || 60;
    return { ...apiError, detail: `Çok fazla deneme yaptın. ${retryAfter} saniye sonra tekrar dene.` };
  }

  return apiError;
};
