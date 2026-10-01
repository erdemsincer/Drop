import { apiClient } from '@/api/apiClient';

import type { DropDetail, NearbyDrop, UpcomingDrop } from '../types/drop';

type GetNearbyDropsParams = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
};

export const getNearbyDrops = async ({
  latitude,
  longitude,
  radiusKm = 5,
}: GetNearbyDropsParams) => {
  const response =
    await apiClient.get<NearbyDrop[]>(
      '/api/drops/nearby',
      {
        params: {
          latitude,
          longitude,
          radiusKm,
        },
      },
    );

  return response.data;
};

/** Sending where you are lets a nearby mystery drop reveal itself. */
export const getDropDetail = async (dropId: string, at?: { latitude: number; longitude: number }) => {
  const response = await apiClient.get<DropDetail>(`/api/drops/${dropId}`, { params: at });
  return response.data;
};

/** Scheduled drops within the radius, starting in the next week. */
export const getUpcomingDrops = async ({ latitude, longitude, radiusKm = 5 }: GetNearbyDropsParams) => {
  const response = await apiClient.get<UpcomingDrop[]>('/api/drops/upcoming', {
    params: { latitude, longitude, radiusKm },
  });

  return response.data;
};
