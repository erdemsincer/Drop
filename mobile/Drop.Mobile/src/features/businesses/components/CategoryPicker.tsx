import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type DropCategory, categoryInfo, categoryOrder } from '@/features/drops/utils/categories';
import { colors, haptics, radius, spacing } from '@/ui';

type Props = {
  value: DropCategory;
  onChange: (value: DropCategory) => void;
};

/** Icon tiles, four per row; customers filter the feed by this. */
export function CategoryPicker({ value, onChange }: Props) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {categoryOrder.map(category => {
        const selected = category === value;
        const { label, icon } = categoryInfo[category];

        return (
          <Pressable
            key={category}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => {
              if (selected) return;
              haptics.tap();
              onChange(category);
            }}
            style={({ pressed }) => [styles.tile, selected && styles.tileSelected, pressed && styles.pressed]}
          >
            <Ionicons name={icon} size={20} color={selected ? colors.textOnDark : colors.primary} />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
  },
  tileSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  labelSelected: {
    color: colors.textOnDark,
  },
});
