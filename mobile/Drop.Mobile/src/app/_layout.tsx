import { Stack } from 'expo-router';

import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { initMonitoring } from '@/services/monitoring';
import { colors } from '@/ui';

// As early as possible, so errors during startup are reported too.
initMonitoring();

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        {/* The themed background avoids a white flash between screens in dark mode. */}
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </AuthProvider>
    </QueryProvider>
  );
}
