import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChoiceChips, colors, haptics, radius, spacing } from '@/ui';

type Props = {
  /** ISO time, or null for "now". */
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
};

const MAX_DAYS_AHEAD = 30;

/** Next full hour at least 30 minutes from now: a sensible default slot. */
const defaultStart = () => {
  const date = new Date(Date.now() + 30 * 60_000);
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
};

export const formatStart = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

export function StartTimePicker({ value, onChange, error }: Props) {
  // Picker bounds are fixed when the form opens; the backend re-checks on submit.
  const [{ minimumDate, maximumDate, fallback }] = useState(() => ({
    minimumDate: new Date(Date.now() + 5 * 60_000),
    maximumDate: new Date(Date.now() + MAX_DAYS_AHEAD * 24 * 3_600_000),
    fallback: defaultStart(),
  }));

  const scheduled = value !== null;
  const date = value ? new Date(value) : fallback;

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      minimumDate,
      maximumDate,
      onChange: (event, picked) => {
        if (event.type !== 'set' || !picked) return;

        DateTimePickerAndroid.open({
          value: picked,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== 'set' || !time) return;
            const combined = new Date(picked);
            combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
            onChange(combined.toISOString());
          },
        });
      },
    });
  };

  return (
    <View style={styles.root}>
      <ChoiceChips
        options={[
          { label: 'Hemen', value: 'now' },
          { label: 'İleri tarihe planla', value: 'later' },
        ]}
        value={scheduled ? 'later' : 'now'}
        onChange={choice => onChange(choice === 'later' ? defaultStart().toISOString() : null)}
      />

      {scheduled && (
        <View style={styles.card}>
          <Ionicons name="calendar" size={20} color={colors.primary} />

          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="compact"
              locale="tr-TR"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              minuteInterval={5}
              onChange={(_, picked) => picked && onChange(picked.toISOString())}
              style={styles.iosPicker}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              style={styles.androidValue}
              onPress={() => {
                haptics.tap();
                openAndroidPicker();
              }}
            >
              <Text style={styles.valueText}>{formatStart(date.toISOString())}</Text>
              <Text style={styles.change}>Değiştir</Text>
            </Pressable>
          )}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.hint}>
        {scheduled
          ? 'Drop seçtiğin saatte otomatik yayına girer; o ana kadar müşteriler göremez.'
          : 'Drop hemen yayına girer ve yakındaki müşteriler anında görür.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  iosPicker: {
    flex: 1,
  },
  androidValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  change: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
