import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelDrop, endDrop } from '../api/businessApi';
import { businessKeys } from './queryKeys';

type Action = 'end' | 'cancel';

export const useDropLifecycle = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dropId, action }: { dropId: string; action: Action }) =>
      action === 'end' ? endDrop(dropId) : cancelDrop(dropId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.branchDrops(branchId) }),
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['drops'] }),
      ]),
  });
};
