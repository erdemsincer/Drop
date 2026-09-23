import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { scheduleClaimReminder, syncClaimReminders } from '@/features/notifications/claimReminders';

import { getActiveClaim } from '../api/claimApi';

export const useActiveClaim = () => {
  const query = useQuery({
    queryKey: ['claims', 'active'],
    queryFn: getActiveClaim,
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  const claim = query.data;

  // Cancelled/redeemed/expired claims lose their reminder; the active one keeps it.
  useEffect(() => {
    if (!query.isSuccess) return;

    void syncClaimReminders(claim?.claimId ?? null);

    if (claim) {
      void scheduleClaimReminder({
        claimId: claim.claimId,
        expiresAt: claim.expiresAt,
        dropTitle: claim.dropTitle,
      });
    }
  }, [query.isSuccess, claim]);

  return query;
};
