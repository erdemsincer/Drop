import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, haptics, radius } from '@/ui';

export type DropSort = 'distance' | 'endingSoon' | 'lastSpots';

const ORDER: DropSort[] = ['distance', 'endingSoon', 'lastSpots'];

const labels: Record<DropSort, { label: string; icon: 'navigate' | 'time' | 'flame' }> = {
  distance: { label: 'En yakın', icon: 'navigate' },
  endingSoon: { label: 'Bitmek üzere', icon: 'time' },
  lastSpots: { label: 'Son yerler', icon: 'flame' },
};

/** One tap cycles the order; compact enough to sit next to the section title. */
export function SortMenu({ value, onChange }: { value: DropSort; onChange: (value: DropSort) => void }) {
  const { label, icon } = labels[value];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sıralama: ${label}. Değiştirmek için dokun`}
      hitSlop={8}
      onPress={() => {
        haptics.tap();
        onChange(ORDER[(ORDER.indexOf(value) + 1) % ORDER.length]);
      }}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={13} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="swap-vertical" size={13} color={colors.textSubtle} />
    </Pressable>
  );
}

export const sortDrops = <T extends { distanceMeters: number; endsAt: string; remainingCapacity: number }>(
  drops: T[],
  sort: DropSort,
): T[] => {
  if (sort === 'distance') return drops;

  return [...drops].sort((a, b) =>
    sort === 'endingSoon'
      ? new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
      : // Sold-out drops sink to the bottom; otherwise fewest places left first.
        (a.remainingCapacity <= 0 ? 1 : 0) - (b.remainingCapacity <= 0 ? 1 : 0) ||
        a.remainingCapacity - b.remainingCapacity,
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
