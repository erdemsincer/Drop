import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { apiClient } from '@/api/apiClient';

export type Badge = {
  id: string;
  earned: boolean;
  progress: number;
  target: number;
  earnedAt?: string | null;
};

export const getBadges = async () => {
  const response = await apiClient.get<Badge[]>('/api/users/me/badges');
  return response.data;
};

type BadgeInfo = {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

/** Names and looks; the server only knows ids and rules. Unknown ids fall back gracefully. */
export const badgeInfo: Record<string, BadgeInfo> = {
  first_drop: { title: 'İlk Drop', description: 'İlk Drop’unu kullandın.', icon: 'flash', color: '#6D4AFF' },
  regular: { title: 'Müdavim', description: '5 Drop kullan.', icon: 'repeat', color: '#2D8CDB' },
  legend: { title: 'Efsane', description: '15 Drop kullan.', icon: 'trophy', color: '#F5B301' },
  coffee_lover: { title: 'Kahve Tutkunu', description: '5 kahve Drop’u kullan.', icon: 'cafe', color: '#9A6240' },
  foodie: { title: 'Gurme', description: '5 yemek Drop’u kullan.', icon: 'restaurant', color: '#F2543D' },
  sweet_tooth: { title: 'Tatlı Krizi', description: '3 tatlı Drop’u kullan.', icon: 'ice-cream', color: '#E0479E' },
  explorer: { title: 'Kaşif', description: '3 farklı kategoride Drop kullan.', icon: 'compass', color: '#12A36A' },
  early_bird: { title: 'Erkenci', description: 'Saat 10’dan önce bir Drop kullan.', icon: 'sunny', color: '#FFA43A' },
  night_owl: { title: 'Gece Kuşu', description: 'Saat 21’den sonra bir Drop kullan.', icon: 'moon', color: '#5B37F2' },
  lightning: { title: 'Şimşek', description: 'Yakaladıktan sonra 5 dakika içinde kullan.', icon: 'rocket', color: '#E8900C' },
  loyal: { title: 'Sadık Müşteri', description: 'Aynı işletmede 3 Drop kullan.', icon: 'heart', color: '#FF5C8A' },
  saver: { title: 'Tutumlu', description: 'Drop’larla toplam ₺500 tasarruf et.', icon: 'wallet', color: '#2BD48A' },
  critic: { title: 'Eleştirmen', description: '5 Drop’u puanla.', icon: 'star', color: '#F5B301' },
};

export const infoFor = (id: string): BadgeInfo =>
  badgeInfo[id] ?? { title: 'Rozet', description: '', icon: 'ribbon', color: '#6D4AFF' };
