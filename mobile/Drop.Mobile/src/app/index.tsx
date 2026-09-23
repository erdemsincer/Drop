import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';
import { Screen, StateView } from '@/ui';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen>
        <StateView loading title="Drop" />
      </Screen>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/(tabs)' : '/(auth)/login'} />;
}
