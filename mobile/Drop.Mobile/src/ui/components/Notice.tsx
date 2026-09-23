import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  message: string;
  tone?: 'danger' | 'warning';
};

export function Notice({ message, tone = 'danger' }: Props) {
  const fg = tone === 'danger' ? colors.danger : colors.warning;
  const bg = tone === 'danger' ? colors.dangerSoft : colors.warningSoft;

  return (
    <View style={[styles.box, { backgroundColor: bg }]} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={20} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
