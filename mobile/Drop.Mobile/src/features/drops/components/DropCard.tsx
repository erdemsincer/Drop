import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PulseDot, colors, radius, shadows, spacing } from '@/ui';
import { formatCurrency } from '@/utils/formatCurrency';

import { useCountdown } from '../hooks/useCountdown';
import type { NearbyDrop } from '../types/drop';
import { categoryInfo, categoryOf } from '../utils/categories';
import { formatDistance } from '../utils/formatDistance';

type Props = {
  drop: NearbyDrop;
  onPress: () => void;
};

const URGENT_SECONDS = 10 * 60;

export function DropCard({ drop, onPress }: Props) {
  const remaining = useCountdown(drop.endsAt);

  if (remaining.isExpired) {
    return null;
  }

  const soldOut = drop.remainingCapacity <= 0;
  const lowStock = !soldOut && drop.remainingCapacity <= 3;
  const urgent = remaining.totalSeconds <= URGENT_SECONDS;
  const claimedRatio = drop.capacity > 0 ? Math.min(1, drop.claimedCount / drop.capacity) : 1;
  const category = categoryInfo[categoryOf(drop.category)];
  const tint = soldOut ? colors.textSubtle : category.tint;

  return (
    <Animated.View entering={FadeInDown.duration(320)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${drop.businessName}: ${drop.title}`}
        style={({ pressed }) => [styles.card, soldOut && styles.cardSoldOut, pressed && styles.pressed]}
      >
        {/* The category paints the top of the card, so a feed of drops reads at a glance. */}
        <LinearGradient
          colors={[`${tint}2E`, `${tint}0D`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Ionicons name={category.icon} size={92} color={`${tint}26`} style={styles.watermark} />

          <View style={styles.heroRow}>
            <View style={[styles.categoryIcon, { backgroundColor: tint }]}>
              <Ionicons name={category.icon} size={20} color="#FFFFFF" />
            </View>

            <View style={styles.business}>
              <Text style={styles.businessName} numberOfLines={1}>
                {drop.businessName}
              </Text>
              <View style={styles.whereRow}>
                <Ionicons name="navigate" size={11} color={colors.textMuted} />
                <Text style={styles.branchName} numberOfLines={1}>
                  {formatDistance(drop.distanceMeters)} · {drop.branchName}
                </Text>
              </View>
            </View>

            <View style={[styles.timer, urgent && styles.timerUrgent]}>
              <Ionicons name="time" size={14} color={urgent ? '#FFFFFF' : colors.lime} />
              <Text style={styles.timerText}>{remaining.label}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {drop.title}
          </Text>

          {!!drop.description && (
            <Text style={styles.description} numberOfLines={2}>
              {drop.description}
            </Text>
          )}

          {drop.minimumSpend != null && (
            <View style={styles.spend}>
              <Ionicons name="wallet-outline" size={13} color={colors.textMuted} />
              <Text style={styles.spendText}>Min. harcama {formatCurrency(drop.minimumSpend)}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.capacity}>
              <View style={styles.capacityRow}>
                {soldOut ? (
                  <Text style={styles.soldOutText}>Tükendi</Text>
                ) : (
                  <>
                    {!lowStock && <PulseDot color={colors.success} size={7} />}
                    {lowStock && <Ionicons name="flame" size={14} color={colors.danger} />}
                    <Text style={[styles.capacityValue, lowStock && styles.capacityLow]}>
                      {drop.remainingCapacity}
                    </Text>
                    <Text style={styles.capacityLabel}>/ {drop.capacity} yer kaldı</Text>
                  </>
                )}
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(4, claimedRatio * 100)}%`,
                      backgroundColor: lowStock || soldOut ? colors.danger : tint,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.cta, { backgroundColor: soldOut ? colors.surfaceMuted : colors.ink }]}>
              <Text style={[styles.ctaText, soldOut && styles.ctaTextMuted]}>{soldOut ? 'Bak' : 'Kap'}</Text>
              <Ionicons name="arrow-forward" size={15} color={soldOut ? colors.textMuted : colors.lime} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardSoldOut: {
    opacity: 0.65,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md + 2,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: 70,
    top: -18,
    transform: [{ rotate: '-14deg' }],
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  business: {
    flex: 1,
  },
  businessName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  whereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  branchName: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  timerUrgent: {
    backgroundColor: colors.warning,
  },
  timerText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 25,
  },
  description: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  spend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
  },
  spendText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  capacity: {
    flex: 1,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  capacityValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  capacityLow: {
    color: colors.danger,
  },
  capacityLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  soldOutText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  track: {
    height: 6,
    marginTop: 7,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 3,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  ctaText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '900',
  },
  ctaTextMuted: {
    color: colors.textMuted,
  },
});
