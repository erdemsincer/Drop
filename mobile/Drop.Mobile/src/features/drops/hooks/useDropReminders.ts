import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type ReminderDrop,
  cancelDropReminder,
  getDropReminders,
  setDropReminder,
} from '@/features/notifications/dropReminders';
import { haptics } from '@/ui';

const KEY = ['drop-reminders'];

/** Which upcoming drops have a "tell me when it starts" reminder, and a toggle for it. */
export const useDropReminders = () => {
  const queryClient = useQueryClient();
  const reminders = useQuery({ queryKey: KEY, queryFn: getDropReminders, staleTime: Infinity });

  const toggle = useMutation({
    mutationFn: async (drop: ReminderDrop) => {
      if (reminders.data?.has(drop.id)) {
        await cancelDropReminder(drop.id);
        return 'off' as const;
      }
      return (await setDropReminder(drop)) ? ('on' as const) : ('denied' as const);
    },
    onSuccess: result => {
      if (result === 'denied') haptics.error();
      else if (result === 'on') haptics.success();
      else haptics.tap();
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });

  return {
    isSet: (dropId: string) => reminders.data?.has(dropId) ?? false,
    toggle: toggle.mutate,
    denied: toggle.data === 'denied',
  };
};
