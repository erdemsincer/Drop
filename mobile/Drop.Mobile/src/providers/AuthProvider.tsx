import { useQueryClient } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

import { setUnauthorizedHandler } from '@/api/apiClient';
import { logout } from '@/features/auth/api/authApi';
import { syncClaimReminders } from '@/features/notifications/claimReminders';
import { clearDropReminders } from '@/features/notifications/dropReminders';
import { unregisterPushToken } from '@/features/notifications/pushRegistration';
import { setMonitoringUser } from '@/services/monitoring';
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
  const queryClient = useQueryClient();

  // Cached queries (profile, businesses, claims...) belong to one account; drop
  // them whenever the session changes so the next user never sees them.
  const refresh = useCallback(async () => {
    queryClient.clear();
    setIsAuthenticated(Boolean(await authStorage.getAccessToken()));
  }, [queryClient]);
  const signOut = useCallback(async () => {
    // While the session still works, so the next account on this phone doesn't get our pushes.
    await unregisterPushToken();
    const refreshToken = await authStorage.getRefreshToken();
    // Revoke server-side too; best effort, signing out must work offline.
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    await authStorage.clear();
    // The previous account's "5 minutes left" reminders must not fire for the next one.
    await syncClaimReminders(null);
    await clearDropReminders();
    setIsAuthenticated(false);
    setMonitoringUser(null);
    queryClient.clear();
  }, [queryClient]);

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
    setUnauthorizedHandler(() => {
      setIsAuthenticated(false);
      queryClient.clear();
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, signOut, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
