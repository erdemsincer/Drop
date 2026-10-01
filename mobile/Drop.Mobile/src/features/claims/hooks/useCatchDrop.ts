import { router } from 'expo-router';

import { scheduleClaimReminder } from '@/features/notifications/claimReminders';
import { haptics } from '@/ui';

import { useCreateClaim } from './useCreateClaim';

type Catchable = { id: string; title: string };

/**
 * Catches a drop the way every screen should: haptics, the "5 minutes left"
 * reminder, then the ticket with a confetti welcome.
 */
export const useCatchDrop = () => {
  const mutation = useCreateClaim();

  const catchDrop = (drop: Catchable) => {
    haptics.press();

    mutation.mutate(drop.id, {
      onSuccess: claim => {
        haptics.success();
        void scheduleClaimReminder({ claimId: claim.claimId, expiresAt: claim.expiresAt, dropTitle: drop.title }, true);

        // Whole minutes from now to the deadline: the ticket's progress bar starts full.
        const durationMinutes = Math.max(1, Math.round((new Date(claim.expiresAt).getTime() - Date.now()) / 60_000));

        router.replace({
          pathname: '/(app)/claim/[id]',
          params: {
            id: claim.claimId,
            expiresAt: claim.expiresAt,
            durationMinutes: String(durationMinutes),
            celebrate: '1',
          },
        });
      },
      onError: () => haptics.error(),
    });
  };

  return { catchDrop, mutation };
};
