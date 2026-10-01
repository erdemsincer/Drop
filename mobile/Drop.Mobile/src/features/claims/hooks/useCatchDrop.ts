import { router } from 'expo-router';

import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import { scheduleClaimReminder } from '@/features/notifications/claimReminders';
import { haptics } from '@/ui';

import { useCreateClaim } from './useCreateClaim';

type Catchable = { id: string; title: string };
type Position = { latitude: number; longitude: number };

/**
 * Catches a drop the way every screen should: haptics, the "5 minutes left"
 * reminder, then the ticket with a confetti welcome. The position goes along
 * (mystery drops need it); without a fresher one, the last known is used.
 */
export const useCatchDrop = () => {
  const mutation = useCreateClaim();
  const lastKnown = useCurrentLocation().data;

  const catchDrop = (drop: Catchable, at?: Position) => {
    haptics.press();

    const position = at ?? (lastKnown ? { latitude: lastKnown.latitude, longitude: lastKnown.longitude } : undefined);

    mutation.mutate(
      { dropId: drop.id, at: position },
      {
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
              ...(claim.price != null ? { price: String(claim.price) } : {}),
            },
          });
        },
        onError: () => haptics.error(),
      },
    );
  };

  return { catchDrop, mutation };
};
