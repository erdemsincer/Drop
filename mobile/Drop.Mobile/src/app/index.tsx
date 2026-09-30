import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { BrandSplash } from '@/features/onboarding/components/BrandSplash';
import { useAuth } from '@/providers/AuthProvider';
import { onboardingStorage } from '@/storage/onboardingStorage';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    void onboardingStorage.hasSeen().then(setHasSeenOnboarding);
  }, []);

  if (isLoading || hasSeenOnboarding === null) return <BrandSplash />;

  if (isAuthenticated) return <Redirect href="/(app)/(tabs)" />;

  return <Redirect href={hasSeenOnboarding ? '/(auth)/login' : '/onboarding'} />;
}
