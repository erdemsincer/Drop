import { StyleSheet, View } from 'react-native';

import { Skeleton, colors, radius, shadows, spacing } from '@/ui';

export function DropCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <Skeleton width={42} height={42} radius={14} />
        <View style={styles.lines}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="40%" height={11} />
        </View>
        <Skeleton width={68} height={30} radius={15} />
      </View>
      <View style={styles.body}>
        <Skeleton width="85%" height={20} />
        <Skeleton width="60%" height={14} style={styles.line} />
        <View style={styles.footer}>
          <View style={styles.lines}>
            <Skeleton width="45%" height={13} />
            <Skeleton width="100%" height={6} />
          </View>
          <Skeleton width={74} height={40} radius={20} />
        </View>
      </View>
    </View>
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  body: {
    padding: spacing.lg,
  },
  lines: {
    flex: 1,
    gap: 7,
  },
  line: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
});
