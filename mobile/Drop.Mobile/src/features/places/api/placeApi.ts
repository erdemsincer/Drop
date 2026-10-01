import { apiClient } from '@/api/apiClient';

export type PlaceDrop = {
  id: string;
  branchId: string;
  branchName: string;
  title: string;
  category: string;
  capacity: number;
  remainingCapacity: number;
  startsAt: string;
  endsAt: string;
  originalPrice?: number | null;
  dealPrice?: number | null;
  photoId?: string | null;
};

/** The customer-facing page of a business. */
export type Place = {
  id: string;
  name: string;
  followerCount: number;
  isFollowing: boolean;
  rating?: number | null;
  ratingCount: number;
  redeemedCount: number;
  branches: { id: string; name: string; latitude: number; longitude: number }[];
  liveDrops: PlaceDrop[];
  upcomingDrops: PlaceDrop[];
};

export const getPlace = async (businessId: string) => {
  const response = await apiClient.get<Place>(`/api/businesses/${businessId}/profile`);
  return response.data;
};
