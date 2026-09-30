import { keyValueStorage } from './keyValueStorage';

const ACCESS_TOKEN_KEY = 'drop.accessToken';
const REFRESH_TOKEN_KEY = 'drop.refreshToken';

export type Session = {
  accessToken: string;
  refreshToken: string;
};

export const authStorage = {
  getAccessToken: () => keyValueStorage.get(ACCESS_TOKEN_KEY),

  getRefreshToken: () => keyValueStorage.get(REFRESH_TOKEN_KEY),

  setSession: async ({ accessToken, refreshToken }: Session) => {
    await Promise.all([
      keyValueStorage.set(ACCESS_TOKEN_KEY, accessToken),
      keyValueStorage.set(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  clear: async () => {
    await Promise.all([keyValueStorage.remove(ACCESS_TOKEN_KEY), keyValueStorage.remove(REFRESH_TOKEN_KEY)]);
  },
};
