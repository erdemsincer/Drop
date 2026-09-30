import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelClaimReminder } from '@/features/notifications/claimReminders';

import { cancelClaim } from '../api/claimApi';

export const useCancelClaim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelClaim,
    onSuccess: async (_, claimId) => {
      await cancelClaimReminder(claimId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['claims'] }),
        // The freed place shows up in remaining capacity.
        queryClient.invalidateQueries({ queryKey: ['drops'] }),
      ]);
    },
  });
};
