import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

// Expo Go on Android dropped expo-notifications (SDK 53+): merely importing it
// logs an error. Load it lazily and only where it works (iOS Expo Go, dev/prod builds).
export const notificationsSupported =
  Platform.OS !== 'web' &&
  !(Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

let cached: NotificationsModule | null = null;

export const getNotifications = (): NotificationsModule | null => {
  if (!notificationsSupported) return null;

  if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;

    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  return cached;
};
