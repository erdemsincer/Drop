import { useQuery } from '@tanstack/react-query';

import { getNearbyDrops } from '../api/dropApi';

type Params = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

export const useNearbyDrops = ({
  latitude,
  longitude,
  radiusKm = 5,
}: Params) => {
  const hasLocation =
    latitude !== undefined &&
    longitude !== undefined;

  return useQuery({
    queryKey: [
      'drops',
      'nearby',
      latitude,
      longitude,
      radiusKm,
    ],

    queryFn: () =>
      getNearbyDrops({
        latitude: latitude!,
        longitude: longitude!,
        radiusKm,
      }),

    enabled: hasLocation,

    staleTime: 30_000,

    refetchInterval: 30_000,
  });
};