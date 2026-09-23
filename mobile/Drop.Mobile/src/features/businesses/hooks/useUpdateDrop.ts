import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateDrop } from '../api/businessApi';
import type { UpdateDropRequest } from '../types/business';
import { businessKeys } from './queryKeys';

export const useUpdateDrop = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dropId, request }: { dropId: string; request: UpdateDropRequest }) =>
      updateDrop(dropId, request),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: businessKeys.branchDrops(branchId) }),
        queryClient.invalidateQueries({ queryKey: ['drops'] }),
      ]),
  });
};
