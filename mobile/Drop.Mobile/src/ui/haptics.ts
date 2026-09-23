import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics are best-effort: never let a missing engine break a user action.
const safe = (run: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  run().catch(() => undefined);
};

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
