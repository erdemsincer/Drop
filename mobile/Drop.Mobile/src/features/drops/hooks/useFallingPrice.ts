import { useEffect, useState } from 'react';

import { type FallingState, fallingPriceOf } from '../utils/pricing';

type Falling = Parameters<typeof fallingPriceOf>[0];

/** The falling price, re-read every second so the countdown to the next step ticks. */
export const useFallingPrice = (drop: Falling): FallingState | null => {
  const [now, setNow] = useState(() => Date.now());
  const falling = drop.startPrice != null;

  useEffect(() => {
    if (!falling) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [falling]);

  return fallingPriceOf(drop, now);
};
