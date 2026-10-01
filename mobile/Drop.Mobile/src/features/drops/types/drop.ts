export type NearbyDrop = {
  id: string;
  branchId: string;

  businessName: string;
  branchName: string;

  title: string;
  description?: string | null;

  minimumSpend?: number | null;

  capacity: number;
  claimedCount: number;
  remainingCapacity: number;

  distanceMeters: number;

  endsAt: string;

  /** DropCategory name; see utils/categories. */
  category: string;

  /** The branch's position, for the map. */
  latitude: number;
  longitude: number;
};

export type DropDetail = {
  id: string;
  branchId: string;
  businessId: string;

  businessName: string;
  branchName: string;

  title: string;
  description?: string | null;

  minimumSpend?: number | null;

  capacity: number;
  claimedCount: number;
  remainingCapacity: number;

  startsAt: string;
  endsAt: string;

  claimDurationMinutes: number;

  latitude: number;
  longitude: number;

  category: string;
};