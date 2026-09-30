import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore on device, localStorage on web (Expo web has no keychain).
export const keyValueStorage = {
  get: (key: string) =>
    Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key),

  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  remove: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
