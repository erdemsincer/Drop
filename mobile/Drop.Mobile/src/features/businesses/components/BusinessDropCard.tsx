import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { Badge, colors, radius, shadows, spacing } from '@/ui';
import { formatCurrency } from '@/utils/formatCurrency';

import type { BusinessDrop } from '../types/business';
import { statusLabels } from '../utils/businessLabels';

type Props = {
  drop: BusinessDrop;
  canManage?: boolean;
  busy?: boolean;
  onEdit?: () => void;
  onRepublish?: () => void;
  onEnd?: () => void;
  onCancel?: () => void;
};

export function BusinessDropCard({
  drop,
  canManage = false,
  busy = false,
  onEdit,
  onRepublish,
  onEnd,
  onCancel,
}: Props) {
  const remaining = useCountdown(drop.endsAt ?? new Date(0).toISOString());
  const live = drop.status === 'Active' && !remaining.isExpired;

  const redeemedShare = drop.capacity > 0 ? drop.redeemedCount / drop.capacity : 0;
  const activeShare = drop.capacity > 0 ? drop.activeClaimCount / drop.capacity : 0;

  return (
    <View style={[styles.card, !live && styles.cardPast]}>
      <View style={styles.header}>
        {live ? (
          <Badge label={statusLabels.Active} tone="success" live />
        ) : (
          <Badge label={statusLabels[drop.status === 'Active' ? 'Expired' : drop.status]} tone="neutral" />
        )}

        {live ? (
          <View style={styles.timer}>
            <Ionicons name="time" size={14} color={colors.textOnDark} />
            <Text style={styles.timerText}>{remaining.label}</Text>
          </View>
        ) : (
          drop.endsAt && (
            <Text style={styles.endedAt}>
              {new Date(drop.endsAt).toLocaleString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {drop.title}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>{drop.capacity} kişilik</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{drop.claimDurationMinutes} dk kullanım</Text>
        {drop.minimumSpend != null && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>Min. {formatCurrency(drop.minimumSpend)}</Text>
          </>
        )}
      </View>

      <View style={styles.stack}>
        <View style={[styles.stackPart, { flex: redeemedShare, backgroundColor: colors.success }]} />
        <View style={[styles.stackPart, { flex: activeShare, backgroundColor: colors.primary }]} />
        <View style={[styles.stackPart, { flex: Math.max(0, 1 - redeemedShare - activeShare) }]} />
      </View>

      <View style={styles.metrics}>
        <Metric color={colors.primary} label="Aktif rezervasyon" value={drop.activeClaimCount} />
        <Metric color={colors.success} label="Kullanıldı" value={drop.redeemedCount} />
        <Metric color={colors.border} label="Kalan" value={drop.remainingCapacity} />
      </View>

      {!live && canManage && onRepublish && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${drop.title} tekrar yayınla`}
          onPress={onRepublish}
          style={({ pressed }) => [styles.republish, pressed && styles.actionPressed]}
        >
          <Ionicons name="repeat" size={16} color={colors.primary} />
          <Text style={styles.republishText}>Tekrar yayınla</Text>
        </Pressable>
      )}

      {live && canManage && (
        <View style={styles.actions}>
          {busy ? (
            <ActivityIndicator color={colors.primary} style={styles.busy} />
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={onEdit}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
                <Text style={styles.actionText}>Düzenle</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onEnd}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Ionicons name="stop-circle-outline" size={16} color={colors.text} />
                <Text style={styles.actionText}>Bitir</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.action, styles.actionDanger, pressed && styles.actionPressed]}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.actionText, styles.actionTextDanger]}>İptal et</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function Metric({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricLabelRow}>
        <View style={[styles.metricDot, { backgroundColor: color }]} />
        <Text style={styles.metricLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  cardPast: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
  },
  timerText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  endedAt: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: colors.textSubtle,
  },
  stack: {
    flexDirection: 'row',
    height: 8,
    marginTop: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
  },
  stackPart: {
    height: '100%',
  },
  metrics: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  metric: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  republish: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    marginTop: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  republishText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  actionDanger: {
    backgroundColor: colors.dangerSoft,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  actionTextDanger: {
    color: colors.danger,
  },
  busy: {
    flex: 1,
    height: 40,
  },
  metricValue: {
    marginTop: 3,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
});
