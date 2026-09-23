import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { haptics } from '../haptics';
import { colors, gradients, radius, shadows } from '../theme';

type Variant = 'primary' | 'dark' | 'light' | 'ghost';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  trailingIcon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const foreground: Record<Variant, string> = {
  primary: '#FFFFFF',
  dark: '#FFFFFF',
  light: colors.text,
  ghost: colors.primary,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  loading = false,
  disabled = false,
  size = 'lg',
  style,
}: Props) {
  const inactive = disabled || loading;
  const color = inactive && variant !== 'ghost' ? colors.textSubtle : foreground[variant];
  const height = size === 'lg' ? 58 : 48;

  const content = (
    <View style={[styles.content, { height }]}>
      {loading ? (
        <ActivityIndicator color={foreground[variant]} />
      ) : (
        icon && <Ionicons name={icon} size={19} color={color} />
      )}
      <Text style={[styles.title, size === 'md' && styles.titleMd, { color }]}>{title}</Text>
      {!loading && trailingIcon && <Ionicons name={trailingIcon} size={18} color={color} />}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && !inactive && shadows.primary,
        variant === 'dark' && styles.dark,
        variant === 'light' && styles.light,
        inactive && variant !== 'ghost' && styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {variant === 'primary' && !inactive ? (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md + 2,
  },
  gradient: {
    borderRadius: radius.md + 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  titleMd: {
    fontSize: 14,
  },
  dark: {
    backgroundColor: colors.ink,
  },
  light: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactive: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
