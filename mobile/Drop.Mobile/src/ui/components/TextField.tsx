import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, isDark, radius, spacing } from '../theme';

type Props = Omit<ComponentProps<typeof TextInput>, 'style'> & {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  error?: string;
};

export function TextField({ label, icon, error, secureTextEntry, multiline, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const tint = error ? colors.danger : focused ? colors.primary : colors.textSubtle;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <Ionicons name={icon} size={19} color={tint} style={multiline && styles.iconMultiline} />

        <TextInput
          keyboardAppearance={isDark ? 'dark' : 'light'}
          {...props}
          secureTextEntry={secureTextEntry && hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor={colors.textSubtle}
          autoCorrect={false}
          accessibilityLabel={label}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.inputMultiline]}
        />

        {secureTextEntry && (
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}
            onPress={() => setHidden(value => !value)}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSubtle} />
          </Pressable>
        )}
      </View>

      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
  },
  inputWrapMultiline: {
    alignItems: 'flex-start',
    height: undefined,
    minHeight: 104,
    paddingVertical: 14,
  },
  iconMultiline: {
    marginTop: 1,
  },
  inputFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  inputError: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 76,
    paddingTop: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  error: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
