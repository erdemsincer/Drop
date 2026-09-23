import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BusinessStatus } from '@/features/businesses/types/business';

import { getAdminBusinesses, moderateBusiness, type ModerationAction } from '../api/adminApi';

export const useAdminBusinesses = (status: BusinessStatus) =>
  useQuery({
    queryKey: ['admin', 'businesses', status],
    queryFn: () => getAdminBusinesses(status),
  });

export const useModerateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ businessId, action, reason }: { businessId: string; action: ModerationAction; reason?: string }) =>
      moderateBusiness(businessId, action, reason),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
      ]),
  });
};
