type Priced = { originalPrice?: number | null; dealPrice?: number | null };

export type Deal = { original: number; deal: number; percent: number; saving: number };

/** The before/after price, when the drop has one. */
export const dealOf = ({ originalPrice, dealPrice }: Priced): Deal | null => {
  if (originalPrice == null || dealPrice == null || originalPrice <= 0) return null;

  return {
    original: originalPrice,
    deal: dealPrice,
    percent: Math.round((1 - dealPrice / originalPrice) * 100),
    saving: originalPrice - dealPrice,
  };
};

type Falling = Priced & { startPrice?: number | null; startsAt?: string | null; endsAt: string };

export type FallingState = {
  price: number;
  start: number;
  floor: number;
  /** 0 at the start price, 1 at the floor. */
  fallen: number;
  /** Seconds until the next one-lira-or-more step; null once at the floor. */
  nextDropIn: number | null;
  nextPrice: number | null;
};

const priceAt = (start: number, floor: number, totalMinutes: number, elapsedMinutes: number) =>
  Math.max(floor, Math.floor(start - ((start - floor) * elapsedMinutes) / totalMinutes));

/**
 * The falling price right now. Same rule as the server (Drop.PriceAt): it
 * steps once a minute from startPrice down to dealPrice by endsAt.
 */
export const fallingPriceOf = (drop: Falling, now = Date.now()): FallingState | null => {
  if (drop.startPrice == null || drop.dealPrice == null || !drop.startsAt) return null;

  const from = new Date(drop.startsAt).getTime();
  const to = new Date(drop.endsAt).getTime();
  const totalMinutes = Math.max(1, Math.floor((to - from) / 60_000));
  const elapsedMinutes = Math.min(totalMinutes, Math.max(0, Math.floor((now - from) / 60_000)));

  const start = drop.startPrice;
  const floor = drop.dealPrice;
  const price = priceAt(start, floor, totalMinutes, elapsedMinutes);

  // The next minute where the whole-lira price actually changes.
  let nextMinute = elapsedMinutes + 1;
  while (nextMinute <= totalMinutes && priceAt(start, floor, totalMinutes, nextMinute) === price) nextMinute++;
  const atFloor = price <= floor || nextMinute > totalMinutes;

  return {
    price,
    start,
    floor,
    fallen: start === floor ? 1 : (start - price) / (start - floor),
    nextDropIn: atFloor ? null : Math.max(0, Math.ceil((from + nextMinute * 60_000 - now) / 1000)),
    nextPrice: atFloor ? null : priceAt(start, floor, totalMinutes, nextMinute),
  };
};
