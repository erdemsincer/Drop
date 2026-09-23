import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { createClaim } from '../api/claimApi';

export const useCreateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClaim,

    onSuccess: async data => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['drops', 'nearby'],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            'drops',
            'detail',
            data.dropId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: ['claims', 'active'],
        }),
      ]);
    },
  });
};