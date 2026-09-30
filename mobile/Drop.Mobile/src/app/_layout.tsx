import { Stack } from 'expo-router';

import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { initMonitoring } from '@/services/monitoring';

// As early as possible, so errors during startup are reported too.
initMonitoring();

export default function RootLayout() {
  return <QueryProvider><AuthProvider><Stack screenOptions={{ headerShown: false }} /></AuthProvider></QueryProvider>;
}
