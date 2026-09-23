import { StyleSheet, View } from 'react-native';

import { Skeleton, colors, radius, shadows, spacing } from '@/ui';

export function DropCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={46} height={46} radius={15} />
        <View style={styles.lines}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="35%" height={11} />
        </View>
        <Skeleton width={64} height={26} radius={13} />
      </View>
      <Skeleton width="85%" height={20} style={styles.title} />
      <Skeleton width="60%" height={14} style={styles.line} />
      <View style={styles.footer}>
        <Skeleton width="45%" height={30} />
        <Skeleton width={84} height={36} radius={14} />
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lines: {
    flex: 1,
    gap: 7,
  },
  title: {
    marginTop: spacing.lg,
  },
  line: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
