import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMe } from '@/features/users/hooks/useMe';
import { colors, radius, spacing } from '@/ui';

import type { BusinessStatus } from '../types/business';

type Props = {
  status: BusinessStatus;
  reason?: string | null;
};

const content: Record<Exclude<BusinessStatus, 'Approved'>, { title: string; body: string; tone: 'warning' | 'danger' | 'neutral' }> = {
  Pending: {
    title: 'İşletmen inceleniyor',
    body: 'Onaylandığında Drop yayınlayabilirsin; sana e-posta ile haber vereceğiz. Bu sırada şubeni ve ekibini hazırlayabilirsin.',
    tone: 'warning',
  },
  Rejected: {
    title: 'Başvurun onaylanmadı',
    body: 'Bilgileri güncelleyip bizimle iletişime geçebilirsin.',
    tone: 'danger',
  },
  Suspended: {
    title: 'İşletmen askıya alındı',
    body: 'Yayındaki Drop’ların kaldırıldı. Detaylar için bizimle iletişime geç.',
    tone: 'neutral',
  },
};

const palette = {
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'time' as const },
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'close-circle' as const },
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted, icon: 'pause-circle' as const },
};

/** Explains why a business can't publish yet; renders nothing once approved. */
export function BusinessStatusNotice({ status, reason }: Props) {
  const me = useMe().data;

  if (status === 'Approved') return null;

  // Approval waits on a verified owner e-mail; say so instead of leaving them waiting.
  const needsVerification = status === 'Pending' && me?.emailVerified === false;

  const { title, body, tone } = content[status];
  const { bg, fg, icon } = palette[tone];

  return (
    <View style={[styles.box, { backgroundColor: bg }]} accessibilityRole="alert">
      <Ionicons name={icon} size={22} color={fg} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: fg }]}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {!!reason && (
          <Text style={styles.reason}>
            <Text style={styles.reasonLabel}>Gerekçe: </Text>
            {reason}
          </Text>
        )}
        {needsVerification && (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push('/(app)/account/verify-email')}
            style={styles.verify}
          >
            <Text style={styles.verifyText}>Onay için önce e-postanı doğrula</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  reason: {
    marginTop: 2,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  reasonLabel: {
    fontWeight: '800',
  },
  verify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  verifyText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
