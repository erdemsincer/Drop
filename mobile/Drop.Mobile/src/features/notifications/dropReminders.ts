import { getNotifications } from './notificationsModule';

const PREFIX = 'drop-reminder:';

export type ReminderDrop = {
  id: string;
  title: string;
  businessName: string;
  startsAt: string;
};

/** Ids of upcoming drops this device will announce when they start. */
export const getDropReminders = async (): Promise<Set<string>> => {
  const notifications = getNotifications();
  if (!notifications) return new Set();

  try {
    const scheduled = await notifications.getAllScheduledNotificationsAsync();
    return new Set(
      scheduled.filter(item => item.identifier.startsWith(PREFIX)).map(item => item.identifier.slice(PREFIX.length)),
    );
  } catch {
    return new Set();
  }
};

/**
 * A local notification the moment the drop goes live. Returns false when
 * notifications are unavailable or the user declined them.
 */
export const setDropReminder = async (drop: ReminderDrop): Promise<boolean> => {
  const notifications = getNotifications();
  if (!notifications) return false;

  try {
    const fireAt = new Date(drop.startsAt);
    if (fireAt.getTime() <= Date.now()) return false;

    const current = await notifications.getPermissionsAsync();
    const granted =
      current.granted || (current.canAskAgain && (await notifications.requestPermissionsAsync()).granted);
    if (!granted) return false;

    await notifications.scheduleNotificationAsync({
      identifier: PREFIX + drop.id,
      content: {
        title: `${drop.businessName}: Drop başladı! ⚡`,
        body: `${drop.title}. Yerler sınırlı, hemen yakala!`,
        data: { dropId: drop.id },
      },
      trigger: { type: notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    });
    return true;
  } catch {
    return false;
  }
};

export const cancelDropReminder = async (dropId: string) => {
  const notifications = getNotifications();
  if (!notifications) return;
  await notifications.cancelScheduledNotificationAsync(PREFIX + dropId).catch(() => undefined);
};

/** On sign-out: the next account on this phone shouldn't get these. */
export const clearDropReminders = async () => {
  const ids = await getDropReminders();
  await Promise.all([...ids].map(cancelDropReminder));
};
