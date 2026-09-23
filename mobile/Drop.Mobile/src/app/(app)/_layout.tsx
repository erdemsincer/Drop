import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';
import { Screen, StateView, colors } from '@/ui';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

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
