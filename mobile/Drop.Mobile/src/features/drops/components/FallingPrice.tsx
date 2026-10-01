import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius } from '@/ui';
import { formatCurrency } from '@/utils/formatCurrency';

import type { FallingState } from '../utils/pricing';

type Props = {
  state: FallingState;
  original?: number | null;
  size?: 'md' | 'lg';
  /** Light text for dark backgrounds. */
  inverted?: boolean;
};

/** "↓ ₺87 · next step in 23 s": the live price of a falling-price drop. */
export function FallingPrice({ state, original, size = 'md', inverted = false }: Props) {
  const large = size === 'lg';
  const percent = original ? Math.round((1 - state.price / original) * 100) : null;
  const fg = inverted ? '#FFFFFF' : colors.text;
  const muted = inverted ? 'rgba(255,255,255,0.7)' : colors.textMuted;

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.tag}>
          <Ionicons name="trending-down" size={13} color={colors.ink} />
          <Text style={styles.tagText}>DÜŞEN FİYAT</Text>
        </View>
        {percent != null && percent > 0 && <Text style={[styles.percent, { color: muted }]}>−%{percent}</Text>}
      </View>

      <View style={styles.row}>
        {/* Re-keyed on the price so every step drops in visibly. */}
        <Animated.Text
          key={state.price}
          entering={FadeInDown.duration(320)}
          style={[styles.price, large && styles.priceLarge, { color: fg }]}
        >
          {state.price === 0 ? 'Bedava' : formatCurrency(state.price)}
        </Animated.Text>
        {original != null && (
          <Text style={[styles.original, large && styles.originalLarge, { color: muted }]}>{formatCurrency(original)}</Text>
        )}
      </View>

      <View style={[styles.track, inverted && styles.trackInverted]}>
        <View style={[styles.fill, { width: `${Math.max(4, state.fallen * 100)}%` }]} />
      </View>

      <Text style={[styles.caption, { color: muted }]}>
        {state.nextDropIn != null && state.nextPrice != null
          ? `${state.nextDropIn} sn sonra ${formatCurrency(state.nextPrice)} · en düşük ${formatCurrency(state.floor)}`
          : `En düşük fiyatta: ${formatCurrency(state.floor)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
  },
  tagText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  percent: {
    fontSize: 12,
    fontWeight: '800',
  },
  price: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  priceLarge: {
    fontSize: 32,
  },
  original: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  originalLarge: {
    fontSize: 17,
  },
  track: {
    height: 5,
    marginTop: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
  },
  trackInverted: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.lime,
    borderRadius: 3,
  },
  caption: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
