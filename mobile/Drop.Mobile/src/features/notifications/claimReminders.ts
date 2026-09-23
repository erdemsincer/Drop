import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMIND_BEFORE_MS = 5 * 60_000;
const MIN_LEAD_MS = 15_000;
const PREFIX = 'claim-reminder:';

export type ReminderClaim = {
  claimId: string;
  expiresAt: string;
  dropTitle?: string;
};

const supported = Platform.OS !== 'web';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Asked only when the user actually claims a drop, where the value is obvious.
const ensurePermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
};

/**
 * Schedules a local "5 minutes left" reminder. Idempotent per claim, so it is
 * safe to call on every active-claim refresh. Best effort: never throws.
 */
export const scheduleClaimReminder = async (claim: ReminderClaim, askPermission = false) => {
  if (!supported) return;

  try {
    const fireAt = new Date(claim.expiresAt).getTime() - REMIND_BEFORE_MS;
    if (fireAt - Date.now() < MIN_LEAD_MS) return;

    const granted = askPermission
      ? await ensurePermission()
      : (await Notifications.getPermissionsAsync()).granted;
    if (!granted) return;

    const identifier = PREFIX + claim.claimId;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Drop'unun süresi dolmak üzere ⏳",
        body: claim.dropTitle
          ? `"${claim.dropTitle}" için 5 dakikan kaldı. İşletmede QR kodu okutmayı unutma!`
          : "5 dakikan kaldı. İşletmede QR kodu okutmayı unutma!",
        data: { claimId: claim.claimId, expiresAt: claim.expiresAt },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
    });
  } catch {
    // Reminders are a convenience; claiming must never fail because of them.
  }
};

export const cancelClaimReminder = async (claimId: string) => {
  if (!supported) return;
  await Notifications.cancelScheduledNotificationAsync(PREFIX + claimId).catch(() => undefined);
};

/** Drops reminders for claims that are no longer active (redeemed, cancelled, expired). */
export const syncClaimReminders = async (activeClaimId: string | null) => {
  if (!supported) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    await Promise.all(
      scheduled
        .filter(item => item.identifier.startsWith(PREFIX) && item.identifier !== PREFIX + activeClaimId)
        .map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)),
    );
  } catch {
    // ignore
  }
};
