import { isAxiosError } from 'axios';

import type { ApiError } from './apiError';

export const getApiError = (error: unknown): ApiError | null => {
  if (!isAxiosError(error) || !error.response?.data) return null;
  return error.response.data as ApiError;
};
