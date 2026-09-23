import * as Notifications from 'expo-notifications';
import { Redirect, Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { Screen, StateView, colors } from '@/ui';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Tapping a claim reminder opens that claim's ticket.
  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { claimId?: string; expiresAt?: string };

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
