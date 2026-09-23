import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';
import { IconButton } from './IconButton';

type Props = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function Header({ title, onBack, right }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {onBack && <IconButton icon="chevron-back" accessibilityLabel="Geri dön" onPress={onBack} />}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  side: {
    minWidth: 44,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
