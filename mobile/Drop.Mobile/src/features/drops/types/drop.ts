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

  /** Usual price and the price with the drop (0 = free); both or neither. */
  originalPrice?: number | null;
  dealPrice?: number | null;
  /** Uploaded photo; see utils/media. */
  photoId?: string | null;

  /** Average stars of the business (one decimal), null until rated. */
  businessRating?: number | null;
  businessRatingCount?: number;
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
  /** Usual price and the price with the drop (0 = free); both or neither. */
  originalPrice?: number | null;
  dealPrice?: number | null;
  /** Uploaded photo; see utils/media. */
  photoId?: string | null;
  /** Average stars of the business (one decimal), null until rated. */
  businessRating?: number | null;
  businessRatingCount?: number;
};

/** A scheduled drop nearby, shown before it starts so customers can set a reminder. */
export type UpcomingDrop = {
  id: string;
  branchId: string;
  businessName: string;
  branchName: string;
  title: string;
  category: string;
  capacity: number;
  distanceMeters: number;
  startsAt: string;
  endsAt: string;
  originalPrice?: number | null;
  dealPrice?: number | null;
  photoId?: string | null;
};
