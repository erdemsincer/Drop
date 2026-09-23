import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../theme';
import { Button } from './Button';

type Props = {
  icon?: ComponentProps<typeof Ionicons>['name'];
  tone?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

const toneColors = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  warning: { bg: colors.warningSoft, fg: colors.warning },
};

export function StateView({
  icon = 'sparkles',
  tone = 'primary',
  loading = false,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  const { bg, fg } = toneColors[tone];

  return (
    <View style={styles.root}>
      <View style={styles.iconOuter}>
        <View style={[styles.iconInner, { backgroundColor: bg }]}>
          {loading ? (
            <ActivityIndicator color={fg} size="large" />
          ) : (
            <Ionicons name={icon} size={34} color={fg} />
          )}
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          size="md"
          trailingIcon="arrow-forward"
          style={styles.action}
        />
      )}

      {secondaryLabel && onSecondary && (
        <Button title={secondaryLabel} onPress={onSecondary} variant="ghost" size="md" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  iconOuter: {
    padding: 10,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl + 6,
    ...shadows.card,
  },
  iconInner: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    maxWidth: 320,
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 200,
  },
});
