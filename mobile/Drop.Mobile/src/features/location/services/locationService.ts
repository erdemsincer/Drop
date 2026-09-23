import * as Location from 'expo-location';

import type { UserLocation } from '../types/location';

export const getCurrentLocation =
  async (): Promise<UserLocation> => {
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error(
        'location.permission_denied',
      );
    }

    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };