import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, haptics, radius, spacing } from '@/ui';

import { type DropCategory, categoryInfo, categoryOrder } from '../utils/categories';

type Props = {
  /** How many drops each category has right now; categories with none are hidden. */
  counts: Partial<Record<DropCategory, number>>;
  total: number;
  value: DropCategory | null;
  onChange: (value: DropCategory | null) => void;
};

export function CategoryFilter({ counts, total, value, onChange }: Props) {
  const present = categoryOrder.filter(category => (counts[category] ?? 0) > 0);

  // One category (or none) leaves nothing to filter.
  if (present.length < 2) return null;

  const select = (next: DropCategory | null) => {
    if (next === value) return;
    haptics.tap();
    onChange(next);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      <Chip label="Tümü" count={total} selected={value === null} onPress={() => select(null)} />
      {present.map(category => (
        <Chip
          key={category}
          label={categoryInfo[category].label}
          icon={categoryInfo[category].icon}
          tint={categoryInfo[category].tint}
          count={counts[category] ?? 0}
          selected={value === category}
          onPress={() => select(category)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  icon,
  tint = colors.primary,
  count,
  selected,
  onPress,
}: {
  label: string;
  icon?: (typeof categoryInfo)[DropCategory]['icon'];
  tint?: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${count} Drop`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? colors.lime : tint} />}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      <Text style={[styles.count, selected && styles.countSelected]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing.xl,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  labelSelected: {
    color: colors.textOnDark,
  },
  count: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
  },
  countSelected: {
    color: colors.lime,
  },
});
