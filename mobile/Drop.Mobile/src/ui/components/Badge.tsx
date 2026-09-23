import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '../theme';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'glass';

const palette: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
  glass: { bg: 'rgba(255,255,255,0.14)', fg: '#FFFFFF' },
};

type Props = {
  label: string;
  tone?: Tone;
  icon?: ComponentProps<typeof Ionicons>['name'];
  live?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'primary', icon, live = false, style }: Props) {
  const { bg, fg } = palette[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {live && <View style={[styles.dot, { backgroundColor: tone === 'glass' ? colors.lime : fg }]} />}
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
