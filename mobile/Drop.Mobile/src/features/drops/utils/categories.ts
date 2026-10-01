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
  /** Map pins and accents; readable with white icons on top. */
  tint: string;
};

export const categoryInfo: Record<DropCategory, CategoryInfo> = {
  Food: { label: 'Yemek', icon: 'restaurant', tint: '#F2543D' },
  Coffee: { label: 'Kahve', icon: 'cafe', tint: '#9A6240' },
  Dessert: { label: 'Tatlı', icon: 'ice-cream', tint: '#E0479E' },
  Drinks: { label: 'İçecek', icon: 'beer', tint: '#E8900C' },
  Beauty: { label: 'Bakım', icon: 'cut', tint: '#9B51E0' },
  Shopping: { label: 'Alışveriş', icon: 'bag-handle', tint: '#2D8CDB' },
  Entertainment: { label: 'Eğlence', icon: 'game-controller', tint: '#12A36A' },
  Other: { label: 'Diğer', icon: 'pricetag', tint: '#6D4AFF' },
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
