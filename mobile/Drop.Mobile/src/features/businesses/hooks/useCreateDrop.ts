import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createDrop } from '../api/businessApi';
import type { CreateDropRequest } from '../types/business';
import { businessKeys } from './queryKeys';

export const useCreateDrop = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateDropRequest) => createDrop(branchId, request),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.branchDrops(branchId) }),
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['drops', 'nearby'] }),
      ]),
  });
};
