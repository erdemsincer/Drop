import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { keyValueStorage } from '@/storage/keyValueStorage';

import { type Badge, getBadges } from '../api/badgeApi';

const seenKey = (userId: string) => `drop.badges.seen.${userId}`;

/**
 * The badges, plus the ones earned since this device last showed them, so
 * the profile can celebrate each new badge exactly once.
 */
export const useBadges = (userId: string | undefined) => {
  const query = useQuery({
    // Under "claims" so using or rating a drop refreshes them.
    queryKey: ['claims', 'badges'],
    queryFn: getBadges,
    enabled: Boolean(userId),
  });
  const [fresh, setFresh] = useState<Badge[]>([]);

  useEffect(() => {
    if (!userId || !query.data) return;
    let cancelled = false;

    void (async () => {
      const stored = await keyValueStorage.get(seenKey(userId)).catch(() => null);
      const seen = new Set<string>(stored ? (JSON.parse(stored) as string[]) : []);
      const earned = query.data.filter(badge => badge.earned);
      const unseen = earned.filter(badge => !seen.has(badge.id));

      if (!cancelled && unseen.length > 0) setFresh(unseen);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, query.data]);

  /** Call once the celebration was shown. */
  const markSeen = async () => {
    if (!userId || !query.data) return;
    const earnedIds = query.data.filter(badge => badge.earned).map(badge => badge.id);
    setFresh([]);
    await keyValueStorage.set(seenKey(userId), JSON.stringify(earnedIds)).catch(() => undefined);
  };

  return { badges: query.data ?? [], fresh, markSeen };
};
