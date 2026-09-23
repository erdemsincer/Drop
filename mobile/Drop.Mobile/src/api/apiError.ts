export type ValidationError = { code: string; message: string };

export type ApiError = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  traceId?: string;
  correlationId?: string;
  errors?: Record<string, ValidationError[]>;
};

export const getApiErrorMessage = (error: ApiError, field?: string) =>
  (field ? error.errors?.[field]?.[0]?.message : undefined)
  ?? error.detail
  ?? error.title;
