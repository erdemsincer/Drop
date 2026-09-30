import { keyValueStorage } from './keyValueStorage';

// Bump the version to show a reworked intro to everyone once more.
const ONBOARDING_KEY = 'drop.onboarding.v1';

export const onboardingStorage = {
  hasSeen: async () => (await keyValueStorage.get(ONBOARDING_KEY).catch(() => null)) === 'done',
  markSeen: () => keyValueStorage.set(ONBOARDING_KEY, 'done').catch(() => undefined),
};
