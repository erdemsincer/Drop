import { useMutation, useQueryClient } from '@tanstack/react-query';

import { haptics } from '@/ui';

import { rateClaim } from '../api/claimApi';
import type { MyClaim } from '../types/claim';

const MINE = ['claims', 'mine'];

/** Stars show at once; a failed save puts the old value back. */
export const useRateClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rateClaim,
    onMutate: async ({ claimId, stars }) => {
      await queryClient.cancelQueries({ queryKey: MINE });
      const previous = queryClient.getQueryData<MyClaim[]>(MINE);
      queryClient.setQueryData<MyClaim[]>(MINE, claims =>
        claims?.map(claim => (claim.claimId === claimId ? { ...claim, rating: stars } : claim)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      haptics.error();
      if (context?.previous) queryClient.setQueryData(MINE, context.previous);
    },
    onSuccess: () => {
      haptics.success();
      // The business's average changed.
      void queryClient.invalidateQueries({ queryKey: ['drops'] });
      void queryClient.invalidateQueries({ queryKey: ['business-profile'] });
    },
  });
};
