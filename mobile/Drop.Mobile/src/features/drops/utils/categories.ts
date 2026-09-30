import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type DropCategory =
  | 'Food'
  | 'Coffee'
  | 'Dessert'
  | 'Drinks'
  | 'Beauty'
  | 'Shopping'
  | 'Entertainment'
  | 'Other';

type CategoryInfo = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export const categoryInfo: Record<DropCategory, CategoryInfo> = {
  Food: { label: 'Yemek', icon: 'restaurant' },
  Coffee: { label: 'Kahve', icon: 'cafe' },
  Dessert: { label: 'Tatlı', icon: 'ice-cream' },
  Drinks: { label: 'İçecek', icon: 'beer' },
  Beauty: { label: 'Bakım', icon: 'cut' },
  Shopping: { label: 'Alışveriş', icon: 'bag-handle' },
  Entertainment: { label: 'Eğlence', icon: 'game-controller' },
  Other: { label: 'Diğer', icon: 'pricetag' },
};

/** Display order in pickers and filters; "Other" always last. */
export const categoryOrder: DropCategory[] = [
  'Food',
  'Coffee',
  'Dessert',
  'Drinks',
  'Beauty',
  'Shopping',
  'Entertainment',
  'Other',
];

// Older API responses (or unknown future values) fall back to "Other".
export const categoryOf = (value: string | null | undefined): DropCategory =>
  value && value in categoryInfo ? (value as DropCategory) : 'Other';
