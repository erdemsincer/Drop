import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, ProgressBar, colors, radius, shadows, spacing } from '@/ui';
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
  const claimedRatio = drop.capacity > 0 ? drop.claimedCount / drop.capacity : 1;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${drop.businessName}: ${drop.title}`}
      style={({ pressed }) => [styles.card, soldOut && styles.cardSoldOut, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Avatar name={drop.businessName} size={46} />

        <View style={styles.business}>
          <Text style={styles.businessName} numberOfLines={1}>
            {drop.businessName}
          </Text>
          <Text style={styles.branchName} numberOfLines={1}>
            {drop.branchName}
          </Text>
        </View>

        <View style={styles.distance}>
          <Ionicons name="navigate" size={12} color={colors.primary} />
          <Text style={styles.distanceText}>{formatDistance(drop.distanceMeters)}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {drop.title}
      </Text>

      {!!drop.description && (
        <Text style={styles.description} numberOfLines={2}>
          {drop.description}
        </Text>
      )}

      <View style={styles.tags}>
        {soldOut ? (
          <Badge label="TÜKENDİ" tone="neutral" />
        ) : lowStock ? (
          <Badge label={`SON ${drop.remainingCapacity}`} tone="danger" icon="flame" />
        ) : (
          <Badge label="AKTİF" tone="success" live />
        )}

        {categoryOf(drop.category) !== 'Other' && (
          <Badge
            label={categoryInfo[categoryOf(drop.category)].label}
            tone="primary"
            icon={categoryInfo[categoryOf(drop.category)].icon}
          />
        )}

        {drop.minimumSpend != null && (
          <Badge label={`Min. ${formatCurrency(drop.minimumSpend)}`} tone="neutral" icon="wallet-outline" />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.capacity}>
          <View style={styles.capacityRow}>
            <Text style={styles.capacityValue}>{drop.remainingCapacity}</Text>
            <Text style={styles.capacityLabel}> / {drop.capacity} kaldı</Text>
          </View>
          <ProgressBar
            value={claimedRatio}
            color={lowStock || soldOut ? colors.danger : colors.primary}
            style={styles.progress}
          />
        </View>

        <View style={[styles.timer, urgent && styles.timerUrgent]}>
          <Ionicons name="time" size={15} color={urgent ? colors.warning : colors.textOnDark} />
          <Text style={[styles.timerText, urgent && styles.timerTextUrgent]}>{remaining.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    padding: spacing.lg + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardSoldOut: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  business: {
    flex: 1,
  },
  businessName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  branchName: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  distanceText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 25,
  },
  description: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  capacity: {
    flex: 1,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  capacityValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  capacityLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progress: {
    marginTop: 7,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  timerUrgent: {
    backgroundColor: colors.warningSoft,
  },
  timerText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: colors.warning,
  },
});
