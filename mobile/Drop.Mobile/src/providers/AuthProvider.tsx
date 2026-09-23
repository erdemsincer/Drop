import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

import { setUnauthorizedHandler } from '@/api/apiClient';
import { logout } from '@/features/auth/api/authApi';
import { authStorage } from '@/storage/authStorage';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useCallback(async () => setIsAuthenticated(Boolean(await authStorage.getAccessToken())), []);
  const signOut = useCallback(async () => {
    const refreshToken = await authStorage.getRefreshToken();
    // Revoke server-side too; best effort, signing out must work offline.
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    await authStorage.clear();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    let isActive = true;

    void authStorage.getAccessToken().then((token) => {
      if (isActive) setIsAuthenticated(Boolean(token));
    }).finally(() => {
      if (isActive) setIsLoading(false);
    });

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setIsAuthenticated(false));
    return () => setUnauthorizedHandler(null);
  }, []);

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, signOut, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
