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
};

export type DropDetail = {
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

  startsAt: string;
  endsAt: string;

  claimDurationMinutes: number;

  latitude: number;
  longitude: number;
};