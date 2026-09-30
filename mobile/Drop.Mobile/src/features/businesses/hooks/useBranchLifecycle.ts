import { useMutation, useQueryClient } from '@tanstack/react-query';

import { closeBranch, reopenBranch } from '../api/businessApi';
import { businessKeys } from './queryKeys';

export const useBranchLifecycle = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: 'close' | 'reopen') =>
      action === 'close' ? closeBranch(branchId) : reopenBranch(branchId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.branch(branchId) }),
        queryClient.invalidateQueries({ queryKey: businessKeys.branchDrops(branchId) }),
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['drops'] }),
      ]),
  });
};
