import { Redirect, Stack, router } from 'expo-router';
import { useEffect } from 'react';

import { getNotifications } from '@/features/notifications/notificationsModule';
import { registerPushToken } from '@/features/notifications/pushRegistration';
import { useMe } from '@/features/users/hooks/useMe';
import { useAuth } from '@/providers/AuthProvider';
import { setMonitoringUser } from '@/services/monitoring';
import { Screen, StateView, colors } from '@/ui';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const meId = useMe({ enabled: isAuthenticated }).data?.id;

  useEffect(() => {
    setMonitoringUser(meId ?? null);
  }, [meId]);

  // Keep the push token fresh without prompting; the prompt comes with the first follow.
  useEffect(() => {
    if (isAuthenticated) void registerPushToken({ askPermission: false });
  }, [isAuthenticated]);

  // Tapping a claim reminder opens that claim's ticket.
  useEffect(() => {
    const notifications = getNotifications();
    if (!notifications || !isAuthenticated) return;

    const subscription = notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as {
        claimId?: string;
        expiresAt?: string;
        dropId?: string;
        branchId?: string;
      };

      // "Someone caught your drop" → that branch's dashboard.
      if (data?.branchId) {
        router.push({ pathname: '/(app)/business/branch/[branchId]', params: { branchId: data.branchId } });
        return;
      }

      // "New drop" from a followed business, or an upcoming drop's reminder.
      if (data?.dropId) {
        router.push({ pathname: '/(app)/drop/[id]', params: { id: data.dropId } });
        return;
      }

      if (data?.claimId && data.expiresAt) {
        router.push({ pathname: '/(app)/claim/[id]', params: { id: data.claimId, expiresAt: data.expiresAt } });
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <Screen>
        <StateView loading title="Drop" />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="claim/scanner/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="claim/redeemed/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="business/branch/[branchId]/qr" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
