import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius } from '../theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are in, e.g. to submit right away. */
  onComplete?: (value: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
};

/**
 * One-time code entry drawn as separate boxes. A single hidden input does the
 * typing, so paste and the OS "fill code from e-mail/SMS" suggestion just work.
 */
export function CodeInput({ value, onChange, onComplete, length = 6, error = false, autoFocus = true }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(autoFocus);

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <Pressable accessibilityRole="none" onPress={() => inputRef.current?.focus()} style={styles.row}>
      {Array.from({ length }, (_, index) => {
        const char = value[index] ?? '';
        const active = focused && index === Math.min(value.length, length - 1);

        return (
          <View
            key={index}
            style={[styles.cell, !!char && styles.cellFilled, active && styles.cellActive, error && styles.cellError]}
          >
            <Text style={[styles.char, error && styles.charError]}>{char}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        accessibilityLabel="Doğrulama kodu"
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    maxWidth: 54,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
  },
  cellFilled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cellActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  cellError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  char: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  charError: {
    color: colors.danger,
  },
  // Kept on screen (not display: none) so it can take focus and receive autofill.
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
