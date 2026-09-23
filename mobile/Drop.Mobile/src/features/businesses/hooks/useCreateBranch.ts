import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBranch } from '../api/businessApi';
import type { CreateBranchRequest } from '../types/business';
import { businessKeys } from './queryKeys';

export const useCreateBranch = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBranchRequest) => createBranch(businessId, request),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.branches(businessId) }),
        queryClient.invalidateQueries({ queryKey: businessKeys.mine }),
      ]),
  });
};
