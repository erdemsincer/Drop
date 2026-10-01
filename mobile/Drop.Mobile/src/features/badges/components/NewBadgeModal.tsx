import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button, Confetti, colors, haptics, radius, spacing, typography } from '@/ui';

import { type Badge, infoFor } from '../api/badgeApi';

type Props = {
  badges: Badge[];
  onClose: () => void;
};

/** "New badge!" with confetti; several new ones show the first and count the rest. */
export function NewBadgeModal({ badges, onClose }: Props) {
  const visible = badges.length > 0;

  useEffect(() => {
    if (visible) haptics.success();
  }, [visible]);

  if (!visible) return null;

  const first = badges[0];
  const info = infoFor(first.id);
  const more = badges.length - 1;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card}>
          <View style={[styles.medal, { backgroundColor: info.color }]}>
            <Ionicons name={info.icon} size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.eyebrow}>YENİ ROZET</Text>
          <Text style={styles.title}>{info.title}</Text>
          <Text style={styles.description}>{info.description}</Text>
          {more > 0 && <Text style={styles.more}>+{more} rozet daha kazandın!</Text>}
          <Button title="Harika!" icon="sparkles" onPress={onClose} style={styles.button} />
        </Animated.View>
        <Confetti burstKey={1} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: 'rgba(14,11,26,0.6)',
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
  },
  medal: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.lime,
    borderRadius: 48,
  },
  eyebrow: {
    ...typography.overline,
    marginTop: spacing.lg,
    color: colors.primary,
  },
  title: {
    ...typography.title,
    marginTop: 4,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  more: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
