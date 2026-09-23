import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '../haptics';
import { colors, radius, spacing } from '../theme';

export type Choice<T> = {
  label: string;
  value: T;
};

type Props<T> = {
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ChoiceChips<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map(option => {
        const selected = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              haptics.tap();
              onChange(option.value);
            }}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  labelSelected: {
    color: colors.textOnDark,
  },
});
