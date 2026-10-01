import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/ui';
import { formatCurrency } from '@/utils/formatCurrency';

import type { Deal } from '../utils/pricing';

type Props = {
  deal: Deal;
  size?: 'md' | 'lg';
  /** Light text for dark heroes. */
  inverted?: boolean;
};

/** "₺75  ₺120  −%38": the deal price, the struck-through usual price and the discount. */
export function DealPrice({ deal, size = 'md', inverted = false }: Props) {
  const large = size === 'lg';

  return (
    <View style={styles.row}>
      <Text style={[styles.deal, large && styles.dealLarge, inverted && styles.inverted]}>
        {deal.deal === 0 ? 'Bedava' : formatCurrency(deal.deal)}
      </Text>
      <Text style={[styles.original, large && styles.originalLarge, inverted && styles.invertedMuted]}>
        {formatCurrency(deal.original)}
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>−%{deal.percent}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deal: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  dealLarge: {
    fontSize: 28,
  },
  original: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  originalLarge: {
    fontSize: 17,
  },
  inverted: {
    color: '#FFFFFF',
  },
  invertedMuted: {
    color: 'rgba(255,255,255,0.6)',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
});
