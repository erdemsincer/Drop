import { apiClient } from '@/api/apiClient';
import type { DropCategory } from '@/features/drops/utils/categories';

export type DropSchedule = {
  id: string;
  branchId: string;
  title: string;
  capacity: number;
  durationMinutes: number;
  claimDurationMinutes: number;
  category: DropCategory;
  originalPrice?: number | null;
  dealPrice?: number | null;
  photoId?: string | null;
  /** Local "HH:mm". */
  startTime: string;
  /** ISO weekdays: 1 = Monday … 7 = Sunday. */
  days: number[];
  isPaused: boolean;
  nextStartAt?: string | null;
};

export type CreateScheduleRequest = {
  title: string;
  description?: string | null;
  minimumSpend?: number | null;
  capacity: number;
  durationMinutes: number;
  claimDurationMinutes: number;
  startTime: string;
  days: number[];
  category: DropCategory;
  originalPrice?: number | null;
  dealPrice?: number | null;
  photoId?: string | null;
};

export const getSchedules = async (branchId: string) =>
  (await apiClient.get<DropSchedule[]>(`/api/branches/${branchId}/schedules`)).data;

export const createSchedule = async (branchId: string, request: CreateScheduleRequest) =>
  (await apiClient.post<DropSchedule>(`/api/branches/${branchId}/schedules`, request)).data;

export const setSchedulePaused = async (scheduleId: string, paused: boolean) =>
  (await apiClient.post<DropSchedule>(`/api/schedules/${scheduleId}/${paused ? 'pause' : 'resume'}`)).data;

export const deleteSchedule = async (scheduleId: string) => {
  await apiClient.delete(`/api/schedules/${scheduleId}`);
};
