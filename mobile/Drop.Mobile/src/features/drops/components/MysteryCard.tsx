import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, gradients, radius, shadows, spacing } from '@/ui';

import { useCountdown } from '../hooks/useCountdown';
import type { NearbyDrop } from '../types/drop';
import { formatDistance } from '../utils/formatDistance';
import { MysteryBox } from './MysteryBox';

const UNLOCK_METERS = 150;

/** A locked mystery drop in the feed: a hint, how far, and the clock. */
export function MysteryCard({ drop, onPress }: { drop: NearbyDrop; onPress: () => void }) {
  const remaining = useCountdown(drop.endsAt);
  if (remaining.isExpired) return null;

  const toGo = Math.max(0, drop.distanceMeters - UNLOCK_METERS);
  const soldOut = drop.remainingCapacity <= 0;

  return (
    <Animated.View entering={FadeInDown.duration(320)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Gizli Drop, ${formatDistance(drop.distanceMeters)} uzakta`}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <LinearGradient colors={gradients.night} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inner}>
          <View style={styles.orb} />

          <View style={styles.row}>
            <MysteryBox size={70} eager={toGo < 200} />
            <View style={styles.text}>
              <Text style={styles.eyebrow}>🎁 GİZLİ DROP</Text>
              <Text style={styles.hint} numberOfLines={3}>
                {drop.description}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.pill}>
              <Ionicons name="navigate" size={13} color={colors.lime} />
              <Text style={styles.pillText}>
                {formatDistance(drop.distanceMeters)} · {toGo > 0 ? `${formatDistance(toGo)} daha yaklaş` : 'Kutu açılmak üzere'}
              </Text>
            </View>
            <View style={styles.meta}>
              <Ionicons name="time" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{remaining.label}</Text>
              <Text style={styles.metaText}>· {soldOut ? 'Tükendi' : `${drop.remainingCapacity} kutu`}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  inner: {
    padding: spacing.lg,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.lime,
    opacity: 0.12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  text: {
    flex: 1,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hint: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
