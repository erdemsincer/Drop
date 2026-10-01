import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/ui';

type Props = {
  value: number | null | undefined;
  onChange?: (stars: number) => void;
  size?: number;
};

/** Five tappable stars; read-only without onChange. */
export function StarRating({ value, onChange, size = 30 }: Props) {
  return (
    <View style={styles.row} accessibilityRole={onChange ? 'adjustable' : undefined}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = (value ?? 0) >= star;
        const icon = (
          <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={filled ? '#F5B301' : '#C9C8D6'} />
        );

        return onChange ? (
          <Pressable
            key={star}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${star} yıldız`}
            onPress={() => {
              haptics.tap();
              onChange(star);
            }}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
});
