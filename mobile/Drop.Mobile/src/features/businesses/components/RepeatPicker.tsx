import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChoiceChips, colors, haptics, radius, spacing } from '@/ui';

import { DAY_SHORT, PRESETS, type Repeat, describeDays } from '../utils/repeat';

type Mode = 'once' | 'daily' | 'weekdays' | 'weekend' | 'custom';

type Props = {
  /** null = a one-off drop. */
  value: Repeat | null;
  onChange: (value: Repeat | null) => void;
};

const toDate = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const toTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const modeOf = (value: Repeat | null): Mode => {
  if (!value) return 'once';
  const key = describeDays(value.days);
  return key === 'Her gün' ? 'daily' : key === 'Hafta içi her gün' ? 'weekdays' : key === 'Hafta sonları' ? 'weekend' : 'custom';
};

/** "Tek sefer" or a repeat: preset days or picked ones, at a time of day. */
export function RepeatPicker({ value, onChange }: Props) {
  const mode = modeOf(value);
  const time = value?.time ?? '15:00';

  const pickMode = (next: Mode) => {
    if (next === 'once') return onChange(null);
    const days = next === 'custom' ? (value?.days ?? [1]) : [...PRESETS[next]];
    onChange({ days, time });
  };

  const toggleDay = (day: number) => {
    if (!value) return;
    haptics.tap();
    const days = value.days.includes(day) ? value.days.filter(d => d !== day) : [...value.days, day];
    // Keep at least one day; an empty repeat makes no sense.
    if (days.length > 0) onChange({ ...value, days });
  };

  const setTime = (date: Date) => value && onChange({ ...value, time: toTime(date) });

  return (
    <View style={styles.root}>
      <ChoiceChips
        options={[
          { label: 'Tek sefer', value: 'once' },
          { label: 'Her gün', value: 'daily' },
          { label: 'Hafta içi', value: 'weekdays' },
          { label: 'Hafta sonu', value: 'weekend' },
          { label: 'Gün seç', value: 'custom' },
        ]}
        value={mode}
        onChange={pickMode}
        wrap
      />

      {value && mode === 'custom' && (
        <View style={styles.days}>
          {DAY_SHORT.map((label, index) => {
            const day = index + 1;
            const on = value.days.includes(day);
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleDay(day)}
                style={[styles.day, on && styles.dayOn]}
              >
                <Text style={[styles.dayText, on && styles.dayTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {value && (
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.timeLabel}>Başlangıç saati</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={toDate(time)}
              mode="time"
              display="compact"
              minuteInterval={5}
              onChange={(_, date) => date && setTime(date)}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                DateTimePickerAndroid.open({
                  value: toDate(time),
                  mode: 'time',
                  is24Hour: true,
                  onChange: (event, date) => event.type === 'set' && date && setTime(date),
                })
              }
              style={styles.timeButton}
            >
              <Text style={styles.timeButtonText}>{time}</Text>
            </Pressable>
          )}
        </View>
      )}

      {value && (
        <Text style={styles.summary}>
          {describeDays(value.days)} saat {time}&apos;da kendiliğinden yayınlanır. Bir gün önceden müşterilerin
          &quot;Yakında&quot; listesinde görünür.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
  },
  dayOn: {
    backgroundColor: colors.ink,
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  dayTextOn: {
    color: colors.lime,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
  },
  timeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summary: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
