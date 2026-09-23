import { useEffect, useState } from 'react';

import { getRemainingTime } from '../utils/getRemainingTime';

export const useCountdown = (endsAt: string) => {
  const [remaining, setRemaining] = useState(
    () => getRemainingTime(endsAt),
  );

  useEffect(() => {
    const updateRemaining = () => {
      setRemaining(getRemainingTime(endsAt));
    };

    // Update immediately
    updateRemaining();

    const interval = setInterval(
      updateRemaining,
      1000,
    );

    return () => clearInterval(interval);
  }, [endsAt]);

  return remaining;
};