import { getNotifications } from './notificationsModule';

const REMIND_BEFORE_MS = 5 * 60_000;
const MIN_LEAD_MS = 15_000;
const PREFIX = 'claim-reminder:';

export type ReminderClaim = {
  claimId: string;
  expiresAt: string;
  dropTitle?: string;
};

type Notifications = NonNullable<ReturnType<typeof getNotifications>>;

// Asked only when the user actually claims a drop, where the value is obvious.
const ensurePermission = async (notifications: Notifications) => {
  const current = await notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await notifications.requestPermissionsAsync()).granted;
};

/**
 * Schedules a local "5 minutes left" reminder. Idempotent per claim, so it is
 * safe to call on every active-claim refresh. Best effort: never throws.
 */
export const scheduleClaimReminder = async (claim: ReminderClaim, askPermission = false) => {
  const notifications = getNotifications();
  if (!notifications) return;

  try {
    const fireAt = new Date(claim.expiresAt).getTime() - REMIND_BEFORE_MS;
    if (fireAt - Date.now() < MIN_LEAD_MS) return;

    const granted = askPermission
      ? await ensurePermission(notifications)
      : (await notifications.getPermissionsAsync()).granted;
    if (!granted) return;

    const identifier = PREFIX + claim.claimId;
    await notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);

    await notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "Drop'unun süresi dolmak üzere ⏳",
        body: claim.dropTitle
          ? `"${claim.dropTitle}" için 5 dakikan kaldı. İşletmede QR kodu okutmayı unutma!`
          : "5 dakikan kaldı. İşletmede QR kodu okutmayı unutma!",
        data: { claimId: claim.claimId, expiresAt: claim.expiresAt },
      },
      trigger: { type: notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
    });
  } catch {
    // Reminders are a convenience; claiming must never fail because of them.
  }
};

export const cancelClaimReminder = async (claimId: string) => {
  const notifications = getNotifications();
  if (!notifications) return;
  await notifications.cancelScheduledNotificationAsync(PREFIX + claimId).catch(() => undefined);
};

/** Drops reminders for claims that are no longer active (redeemed, cancelled, expired). */
export const syncClaimReminders = async (activeClaimId: string | null) => {
  const notifications = getNotifications();
  if (!notifications) return;

  try {
    const scheduled = await notifications.getAllScheduledNotificationsAsync();

    await Promise.all(
      scheduled
        .filter(item => item.identifier.startsWith(PREFIX) && item.identifier !== PREFIX + activeClaimId)
        .map(item => notifications.cancelScheduledNotificationAsync(item.identifier)),
    );
  } catch {
    // ignore
  }
};
