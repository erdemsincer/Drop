import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { apiClient } from '@/api/apiClient';
import { keyValueStorage } from '@/storage/keyValueStorage';

import { getNotifications } from './notificationsModule';

const TOKEN_KEY = 'drop.pushToken';

// Set by `eas init`; without it Expo can't issue a push token (plain Expo Go dev).
const projectId: string | undefined =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

/**
 * Gets this device's Expo push token and registers it for the signed-in user.
 * Best effort and silent: no simulator, no project id, no permission → nothing happens.
 */
export const registerPushToken = async ({ askPermission }: { askPermission: boolean }) => {
  const notifications = getNotifications();
  if (!notifications || !Device.isDevice || !projectId) return;

  try {
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync('default', {
        name: 'Drop bildirimleri',
        importance: notifications.AndroidImportance.HIGH,
      });
    }

    let permission = await notifications.getPermissionsAsync();
    if (!permission.granted && askPermission && permission.canAskAgain) {
      permission = await notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return;

    const { data: token } = await notifications.getExpoPushTokenAsync({ projectId });

    await apiClient.put('/api/users/me/push-token', { token, platform: Platform.OS });
    await keyValueStorage.set(TOKEN_KEY, token);
  } catch {
    // Pushes are a bonus; never let them break the app.
  }
};

/** Detaches this device from the account (call while still signed in). */
export const unregisterPushToken = async () => {
  try {
    const token = await keyValueStorage.get(TOKEN_KEY);
    if (!token) return;

    await keyValueStorage.remove(TOKEN_KEY);
    await apiClient.post('/api/users/me/push-token/remove', { token });
  } catch {
    // The server drops dead tokens on its own.
  }
};
