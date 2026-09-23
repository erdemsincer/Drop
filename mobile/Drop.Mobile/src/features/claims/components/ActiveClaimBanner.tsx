import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCountdown } from '@/features/drops/hooks/useCountdown';
import { Badge, colors, gradients, radius, shadows, spacing } from '@/ui';

import type { ActiveClaim } from '../types/claim';

type Props = {
  claim: ActiveClaim;
  onPress: () => void;
};

export function ActiveClaimBanner({ claim, onPress }: Props) {
  const remaining = useCountdown(claim.expiresAt);

  if (remaining.isExpired) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Aktif Drop: ${claim.dropTitle}. Kalan süre ${remaining.label}`}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.orb} />

        <View style={styles.top}>
          <View style={styles.info}>
            <Badge label="SENİN DROP'UN" tone="glass" live />
            <Text style={styles.title} numberOfLines={2}>
              {claim.dropTitle}
            </Text>
            <Text style={styles.business} numberOfLines={1}>
              {claim.businessName} · {claim.branchName}
            </Text>
          </View>

          <View style={styles.timer}>
            <Text style={styles.timerValue}>{remaining.label}</Text>
            <Text style={styles.timerLabel}>kaldı</Text>
          </View>
        </View>

        <View style={styles.cta}>
          <Ionicons name="qr-code" size={16} color={colors.ink} />
          <Text style={styles.ctaText}>QR kodu okut ve kullan</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.ink} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
    borderRadius: radius.xl,
    ...shadows.primary,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  card: {
    overflow: 'hidden',
    padding: spacing.lg + 2,
    borderRadius: radius.xl,
  },
  orb: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  top: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    marginTop: spacing.md,
    color: colors.textOnDark,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  business: {
    marginTop: 4,
    color: colors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  timer: {
    alignItems: 'flex-end',
  },
  timerValue: {
    color: colors.textOnDark,
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.lime,
    borderRadius: radius.md,
  },
  ctaText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
});
