import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type Position = { latitude: number; longitude: number };

/**
 * Follows the phone while `enabled` (every ~10 m), e.g. while walking towards
 * a mystery drop. Uses the permission the app already has; never asks.
 */
export const useLiveLocation = (enabled: boolean): Position | null => {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted || cancelled) return;

      const watch = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 4000 },
        update => setPosition({ latitude: update.coords.latitude, longitude: update.coords.longitude }),
      );

      if (cancelled) watch.remove();
      else subscription = watch;
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return position;
};
