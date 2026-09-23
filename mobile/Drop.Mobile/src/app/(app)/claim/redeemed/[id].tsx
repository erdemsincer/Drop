import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, colors, gradients, radius, spacing, typography } from '@/ui';

export default function RedeemedScreen() {
  const { id, redeemedAt } = useLocalSearchParams<{ id: string; redeemedAt?: string }>();
  const insets = useSafeAreaInsets();

  const checkScale = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 9, stiffness: 140 });
    ring.value = withDelay(
      250,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [checkScale, ring]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ring.value,
    transform: [{ scale: 1 + ring.value * 0.8 }],
  }));

  const redeemedDate = redeemedAt ? new Date(redeemedAt) : null;

  return (
    <LinearGradient colors={gradients.success} style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.checkWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.check, checkStyle]}>
            <Ionicons name="checkmark" size={64} color={colors.success} />
          </Animated.View>
        </View>

        <Animated.Text entering={FadeInDown.delay(200).duration(450)} style={styles.title}>
          Kullanıldı!
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(320).duration(450)} style={styles.description}>
          Drop başarıyla doğrulandı. Avantajını kasada hemen kullanabilirsin.
        </Animated.Text>

        {redeemedDate && (
          <Animated.View entering={FadeInDown.delay(440).duration(450)} style={styles.receipt}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Tarih</Text>
              <Text style={styles.receiptValue}>
                {redeemedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Saat</Text>
              <Text style={styles.receiptValue}>
                {redeemedDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Claim</Text>
              <Text style={styles.receiptCode} numberOfLines={1}>
                {id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button title="Ana Sayfaya Dön" variant="light" icon="home" onPress={() => router.replace('/(app)')} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  checkWrap: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  check: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
  },
  title: {
    ...typography.display,
    fontSize: 40,
    lineHeight: 46,
    marginTop: spacing.xxl,
    color: colors.textOnDark,
  },
  description: {
    ...typography.body,
    maxWidth: 300,
    marginTop: spacing.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  receipt: {
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.lg,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  receiptLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptValue: {
    color: colors.textOnDark,
    fontSize: 15,
    fontWeight: '800',
  },
  receiptCode: {
    color: colors.textOnDark,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  actions: {
    paddingHorizontal: spacing.xl,
  },
});
