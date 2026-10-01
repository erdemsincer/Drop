import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * iOS uses Apple Maps (no key). Android needs a Google Maps key: Expo Go ships
 * one, but our own builds don't have one yet and MapView would crash there,
 * so the map is offered only where it works.
 */
export const mapAvailable =
  Platform.OS === 'ios' ||
  (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

const KM_PER_DEGREE = 111;

/** A region that fits a circle of `radiusKm` around the point, with a little margin. */
export const regionAround = (latitude: number, longitude: number, radiusKm: number) => {
  const latitudeDelta = (radiusKm * 2.6) / KM_PER_DEGREE;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta: latitudeDelta / Math.max(0.2, Math.cos((latitude * Math.PI) / 180)),
  };
};
