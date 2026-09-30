import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type SentryModule = typeof import('@sentry/react-native');

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Only real builds report: Expo Go and web never even load the native SDK,
// and without a DSN (local development) nothing is initialised.
const enabled =
  !!dsn &&
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let sentry: SentryModule | null = null;

export const initMonitoring = () => {
  if (!enabled || sentry) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sentry = require('@sentry/react-native') as SentryModule;
    sentry.init({
      dsn,
      environment: __DEV__ ? 'development' : 'production',
      // Crashes and errors only; no performance tracing for the pilot.
      tracesSampleRate: 0,
      // Never attach IPs, cookies or request bodies (tokens, QR payloads).
      sendDefaultPii: false,
    });
  } catch {
    sentry = null;
  }
};

/** Tags reports with the signed-in account id (never e-mail or name). */
export const setMonitoringUser = (userId: string | null) => {
  sentry?.setUser(userId ? { id: userId } : null);
};

export const reportError = (error: unknown) => {
  sentry?.captureException(error);
};
