import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui';

type Props = {
  rating?: number | null;
  count?: number;
  inverted?: boolean;
};

/** "★ 4,6 (23)"; nothing until the business has a rating. */
export function RatingPill({ rating, count = 0, inverted = false }: Props) {
  if (rating == null || count === 0) return null;

  return (
    <View style={styles.row} accessibilityLabel={`${count} değerlendirmede ${rating} yıldız`}>
      <Ionicons name="star" size={12} color="#F5B301" />
      <Text style={[styles.value, inverted && styles.inverted]}>{rating.toLocaleString('tr-TR')}</Text>
      <Text style={[styles.count, inverted && styles.invertedMuted]}>({count})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  value: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  count: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  inverted: {
    color: '#FFFFFF',
  },
  invertedMuted: {
    color: 'rgba(255,255,255,0.65)',
  },
});
