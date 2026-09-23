import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { redeemClaim } from '../api/claimApi';

type Variables = {
  claimId: string;
  qrToken: string;
};

export const useRedeemClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimId,
      qrToken,
    }: Variables) =>
      redeemClaim(
        claimId,
        qrToken,
      ),

    onSuccess: async data => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['claims', 'active'],
        }),

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
      ]);
    },
  });
};
