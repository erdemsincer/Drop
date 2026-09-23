import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'drop.accessToken';

export const authStorage = {
  getAccessToken: async () => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  setAccessToken: async (token: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken: async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  },
};