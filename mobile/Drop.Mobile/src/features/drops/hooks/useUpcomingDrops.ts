import { useQuery } from '@tanstack/react-query';

import { getUpcomingDrops } from '../api/dropApi';

type Params = { latitude?: number; longitude?: number; radiusKm: number };

export const useUpcomingDrops = ({ latitude, longitude, radiusKm }: Params) =>
  useQuery({
    queryKey: ['drops', 'upcoming', latitude, longitude, radiusKm],
    queryFn: () => getUpcomingDrops({ latitude: latitude!, longitude: longitude!, radiusKm }),
    enabled: latitude !== undefined && longitude !== undefined,
    staleTime: 60_000,
  });
