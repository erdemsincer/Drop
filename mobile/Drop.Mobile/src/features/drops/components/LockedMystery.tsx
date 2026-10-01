import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton, ProgressBar, colors, gradients, radius, spacing } from '@/ui';
import { openDirections } from '@/utils/openDirections';

import { useCountdown } from '../hooks/useCountdown';
import type { DropDetail } from '../types/drop';
import { formatDistance } from '../utils/formatDistance';
import { shareDrop } from '../utils/shareDrop';
import { MysteryBox } from './MysteryBox';

const UNLOCK_METERS = 150;

type Props = {
  drop: DropDetail;
  /** False when the app has no location: then there is no way to open it. */
  hasLocation: boolean;
};

/** A sealed mystery drop: the box, how far it is, and the way there. It opens itself on arrival. */
export function LockedMystery({ drop, hasLocation }: Props) {
  const insets = useSafeAreaInsets();
  const remaining = useCountdown(drop.endsAt);
  const distance = drop.distanceMeters ?? null;
  // The first distance seen is "the start of the walk"; the bar fills as it shrinks.
  const [startDistance] = useState(() => Math.max(distance ?? 0, UNLOCK_METERS + 1));
  const progress =
    distance == null ? 0 : Math.min(1, Math.max(0, (startDistance - distance) / (startDistance - UNLOCK_METERS)));
  const toGo = distance == null ? null : Math.max(0, distance - UNLOCK_METERS);

  return (
    <LinearGradient colors={gradients.night} style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <StatusBar style="light" />
      <View style={styles.orb} />

      <View style={styles.bar}>
        <IconButton icon="chevron-back" tone="glass" accessibilityLabel="Geri dön" onPress={() => router.back()} />
        <IconButton
          icon="share-outline"
          tone="glass"
          accessibilityLabel="Arkadaşınla paylaş"
          onPress={() => void shareDrop({ ...drop, title: 'Gizli Drop 🎁', businessName: 'Hazine avı' })}
        />
      </View>

      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(500)}>
          <MysteryBox size={150} eager={toGo != null && toGo < 150} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(150)} style={styles.eyebrow}>
          🎁 GİZLİ DROP
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(220)} style={styles.hint}>
          {drop.description}
        </Animated.Text>

        {hasLocation && distance != null ? (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.distanceBox}>
            <Text style={styles.distance}>{formatDistance(distance)}</Text>
            <Text style={styles.distanceCaption}>
              {toGo && toGo > 0
                ? `Kutuyu açmak için ${formatDistance(toGo)} daha yaklaş`
                : 'Çok yakınsın, kutu açılıyor…'}
            </Text>
            <ProgressBar value={progress} color={colors.lime} trackColor="rgba(255,255,255,0.14)" height={8} style={styles.progress} />
          </Animated.View>
        ) : (
          <Text style={styles.noLocation}>
            Kutuyu açmak için konumuna ihtiyacımız var. Konum izni verdiğinde yaklaştıkça kendiliğinden açılır.
          </Text>
        )}

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={15} color={colors.lime} />
            <Text style={styles.metaText}>{remaining.isExpired ? 'Bitti' : remaining.label}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cube" size={15} color={colors.lime} />
            <Text style={styles.metaText}>
              {drop.remainingCapacity > 0 ? `${drop.remainingCapacity} kutu kaldı` : 'Tükendi'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}>
        {hasLocation ? (
          <Button
            title="Yol tarifi al"
            icon="navigate"
            variant="light"
            onPress={() => openDirections(drop.latitude, drop.longitude, 'Gizli Drop')}
          />
        ) : (
          <Button title="Konum iznini aç" icon="location" variant="light" onPress={() => Linking.openSettings()} />
        )}
        <Text style={styles.footnote}>Yanına gitmen yeterli; {UNLOCK_METERS} m içine girince kutu kendiliğinden açılır.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primary,
    opacity: 0.25,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  eyebrow: {
    marginTop: spacing.xl,
    color: colors.lime,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  hint: {
    marginTop: spacing.sm,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
    textAlign: 'center',
  },
  distanceBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.xl,
  },
  distance: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  distanceCaption: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  progress: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  noLocation: {
    marginTop: spacing.xl,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  footnote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
});
