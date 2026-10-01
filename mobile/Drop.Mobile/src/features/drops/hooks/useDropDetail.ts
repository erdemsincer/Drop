import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Position } from '@/features/location/hooks/useLiveLocation';

import { getDropDetail } from '../api/dropApi';

// ~11 m steps: walking around refetches, GPS jitter in place doesn't.
const round = (value: number) => Math.round(value * 10_000) / 10_000;

/** The drop, seen from `at`: a nearby mystery drop comes back unlocked. */
export const useDropDetail = (dropId: string, at?: Position | null) => {
  const position = at ? { latitude: round(at.latitude), longitude: round(at.longitude) } : undefined;

  return useQuery({
    queryKey: ['drops', 'detail', dropId, position?.latitude ?? null, position?.longitude ?? null],
    queryFn: () => getDropDetail(dropId, position),
    enabled: Boolean(dropId),
    staleTime: 10_000,
    // Moving a few metres shouldn't flash a loading screen.
    placeholderData: keepPreviousData,
  });
};
