import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type CreateScheduleRequest,
  createSchedule,
  deleteSchedule,
  getSchedules,
  setSchedulePaused,
} from '../api/scheduleApi';
import { businessKeys } from './queryKeys';

export const useSchedules = (branchId: string) =>
  useQuery({ queryKey: businessKeys.schedules(branchId), queryFn: () => getSchedules(branchId) });

export const useScheduleMutations = (branchId: string) => {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: businessKeys.schedules(branchId) }),
      // Occurrences show up (or disappear) among the branch's drops.
      queryClient.invalidateQueries({ queryKey: businessKeys.branchDrops(branchId) }),
    ]);

  return {
    create: useMutation({
      mutationFn: (request: CreateScheduleRequest) => createSchedule(branchId, request),
      onSuccess: refresh,
    }),
    setPaused: useMutation({
      mutationFn: ({ id, paused }: { id: string; paused: boolean }) => setSchedulePaused(id, paused),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: deleteSchedule, onSuccess: refresh }),
  };
};
