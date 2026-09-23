import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'drop.accessToken';
const REFRESH_TOKEN_KEY = 'drop.refreshToken';

const read = (key: string) =>
  Platform.OS === 'web' ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key);

const write = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const remove = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export type Session = {
  accessToken: string;
  refreshToken: string;
};

export const authStorage = {
  getAccessToken: () => read(ACCESS_TOKEN_KEY),

  getRefreshToken: () => read(REFRESH_TOKEN_KEY),

  setSession: async ({ accessToken, refreshToken }: Session) => {
    await Promise.all([write(ACCESS_TOKEN_KEY, accessToken), write(REFRESH_TOKEN_KEY, refreshToken)]);
  },

  clear: async () => {
    await Promise.all([remove(ACCESS_TOKEN_KEY), remove(REFRESH_TOKEN_KEY)]);
  },
};
