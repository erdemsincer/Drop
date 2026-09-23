import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateBranch } from '../api/businessApi';
import type { UpdateBranchRequest } from '../types/business';
import { businessKeys } from './queryKeys';

export const useUpdateBranch = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateBranchRequest) => updateBranch(branchId, request),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.branch(branchId) }),
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['drops'] }),
      ]),
  });
};
