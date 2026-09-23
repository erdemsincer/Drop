import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/ui';

type Props = {
  prompt: string;
  action: string;
  onPress: () => void;
};

export function AuthSwitchLink({ prompt, action, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link} hitSlop={8}>
      <Text style={styles.text}>
        {prompt} <Text style={styles.action}>{action}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  action: {
    color: colors.primary,
    fontWeight: '800',
  },
});
