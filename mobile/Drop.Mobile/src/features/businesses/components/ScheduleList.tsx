import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { categoryInfo, categoryOf } from '@/features/drops/utils/categories';
import { formatStartsAt } from '@/features/drops/utils/formatStartsAt';
import { colors, haptics, radius, shadows, spacing, typography } from '@/ui';

import type { DropSchedule } from '../api/scheduleApi';
import { useScheduleMutations, useSchedules } from '../hooks/useSchedules';
import { describeDays } from '../utils/repeat';

/** The branch's recurring drops: when they run next, a pause switch and delete. */
export function ScheduleList({ branchId }: { branchId: string }) {
  const schedules = useSchedules(branchId).data ?? [];
  const { setPaused, remove } = useScheduleMutations(branchId);

  if (schedules.length === 0) return null;

  const confirmDelete = (schedule: DropSchedule) =>
    Alert.alert(
      'Tekrarlayan Drop silinsin mi?',
      `"${schedule.title}" artık yayınlanmayacak. Henüz başlamamış olanlar da iptal edilir.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () =>
            remove.mutate(schedule.id, {
              onSuccess: () => haptics.success(),
              onError: () => haptics.error(),
            }),
        },
      ],
    );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons name="repeat" size={16} color={colors.primary} />
        <Text style={styles.title}>Tekrarlayan Drop&apos;lar</Text>
      </View>

      <View style={styles.card}>
        {schedules.map(schedule => {
          const category = categoryInfo[categoryOf(schedule.category)];

          return (
            <View key={schedule.id} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: schedule.isPaused ? colors.surfaceMuted : category.tint }]}>
                <Ionicons name={category.icon} size={18} color={schedule.isPaused ? colors.textSubtle : '#FFFFFF'} />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${schedule.title} sil`}
                onLongPress={() => confirmDelete(schedule)}
                style={styles.text}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {schedule.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {describeDays(schedule.days)} · {schedule.startTime}
                </Text>
                <Text style={[styles.next, schedule.isPaused && styles.paused]} numberOfLines={1}>
                  {schedule.isPaused
                    ? 'Durduruldu'
                    : schedule.nextStartAt
                      ? `Sıradaki: ${formatStartsAt(schedule.nextStartAt)}`
                      : ''}
                </Text>
              </Pressable>

              <Switch
                accessibilityLabel={schedule.isPaused ? 'Sürdür' : 'Durdur'}
                value={!schedule.isPaused}
                onValueChange={running => {
                  haptics.tap();
                  setPaused.mutate({ id: schedule.id, paused: !running });
                }}
                trackColor={{ true: colors.primary, false: colors.border }}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sil"
                hitSlop={8}
                onPress={() => confirmDelete(schedule)}
              >
                <Ionicons name="trash-outline" size={19} color={colors.danger} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  text: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  rowMeta: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  next: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  paused: {
    color: colors.textSubtle,
  },
});
