import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ComponentProps, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { PulseDot, colors, gradients, radius, shadows } from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** 0 → 1 forever; mirrored (1 → 0) when `reverse`. */
function useLoop(duration: number, { reverse = true, delay = 0 } = {}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, reverse),
    );
  }, [progress, duration, reverse, delay]);

  return progress;
}

function useFloat(progress: SharedValue<number>, distance = 8, tilt = 0) {
  return useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -distance]) },
      { rotate: `${tilt}deg` },
    ],
  }));
}

/* ---------------------------------- 1 · Map --------------------------------- */

const pins: { top: number; left: number; icon: IconName; label: string; delay: number }[] = [
  { top: 46, left: 26, icon: 'cafe', label: '%40', delay: 0 },
  { top: 92, left: 176, icon: 'pizza', label: '%25', delay: 350 },
  { top: 196, left: 60, icon: 'ice-cream', label: '1+1', delay: 700 },
];

export function MapIllustration() {
  const pulse = useLoop(1800, { reverse: false });
  const chipFloat = useLoop(2400);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 2.4 }],
  }));

  const chip = useFloat(chipFloat, 6);

  return (
    <View style={styles.stage}>
      <View style={[styles.map, shadows.raised]}>
        {Array.from({ length: 7 }, (_, i) => (
          <View key={`h${i}`} style={[styles.gridH, { top: i * 46 + 12 }]} />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <View key={`v${i}`} style={[styles.gridV, { left: i * 46 + 12 }]} />
        ))}

        <View style={styles.park} />
        <View style={[styles.road, { top: 132, transform: [{ rotate: '-16deg' }] }]} />
        <View style={[styles.road, styles.roadThin, { top: 150, transform: [{ rotate: '64deg' }] }]} />

        <View style={styles.me}>
          <Animated.View style={[styles.meRing, ring]} />
          <View style={styles.meDot} />
        </View>

        {pins.map(pin => (
          <MapPin key={pin.label} {...pin} />
        ))}
      </View>

      <Animated.View style={[styles.mapChip, shadows.raised, chip]}>
        <PulseDot color={colors.success} />
        <Text style={styles.mapChipText}>3 Drop · 400 m içinde</Text>
      </Animated.View>
    </View>
  );
}

function MapPin({ top, left, icon, label, delay }: (typeof pins)[number]) {
  const bob = useLoop(1300, { delay });
  const style = useFloat(bob, 7);

  return (
    <Animated.View style={[styles.pinWrap, { top, left }, style]}>
      <View style={[styles.pin, shadows.card]}>
        <LinearGradient colors={gradients.primary} style={styles.pinIcon}>
          <Ionicons name={icon} size={13} color={colors.lime} />
        </LinearGradient>
        <Text style={styles.pinLabel}>{label}</Text>
      </View>
      <View style={styles.pinTail} />
    </Animated.View>
  );
}

/* ---------------------------------- 2 · Card -------------------------------- */

const COUNTDOWN_FROM = 14 * 60 + 52;
// Card width minus its padding: the bar animates in points, not percentages.
const TRACK_WIDTH = 256 - 16 * 2;

const formatClock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function DropCardIllustration() {
  const [seconds, setSeconds] = useState(COUNTDOWN_FROM);
  const float = useLoop(2600);
  const fill = useLoop(2200);
  const tap = useLoop(1100);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(value => (value > 0 ? value - 1 : COUNTDOWN_FROM)), 1000);
    return () => clearInterval(timer);
  }, []);

  const card = useFloat(float, 10, -3);
  const sticker = useFloat(float, 4, 12);
  const bar = useAnimatedStyle(() => ({
    width: interpolate(fill.value, [0, 1], [TRACK_WIDTH * 0.38, TRACK_WIDTH * 0.72]),
  }));
  const button = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(tap.value, [0, 1], [1, 1.05]) }] }));

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.dropCard, shadows.raised, card]}>
        <View style={styles.rowBetween}>
          <View style={styles.liveBadge}>
            <PulseDot color={colors.success} size={7} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
          <View style={styles.clock}>
            <Ionicons name="time" size={12} color={colors.textOnDark} />
            <Text style={styles.clockText}>{formatClock(seconds)}</Text>
          </View>
        </View>

        <LinearGradient colors={['#FF8A4C', '#F2453D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Ionicons name="cafe" size={40} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroDeal}>%40</Text>
        </LinearGradient>

        <Text style={styles.cardTitle}>Tüm kahvelere %40</Text>
        <Text style={styles.cardMeta}>Kahve Durağı · 250 m</Text>

        <View style={styles.track}>
          <Animated.View style={[styles.trackFill, bar]} />
        </View>
        <Text style={styles.cardHint}>Kontenjan hızla doluyor</Text>

        <Animated.View style={button}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.claim}>
            <Ionicons name="flash" size={15} color={colors.lime} />
            <Text style={styles.claimText}>Yakala</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.sticker, sticker]}>
        <Text style={styles.stickerSmall}>SON</Text>
        <Text style={styles.stickerBig}>8</Text>
      </Animated.View>
    </View>
  );
}

/* ---------------------------------- 3 · Scan -------------------------------- */

const QR_SIZE = 132;

export function ScanIllustration() {
  const scan = useLoop(1600);
  const float = useLoop(2400);
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withRepeat(
      withSequence(
        withDelay(900, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(2)) })),
        withDelay(1800, withTiming(0, { duration: 260 })),
      ),
      -1,
    );
  }, [pop]);

  const line = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scan.value, [0, 1], [0, QR_SIZE + 20]) }],
  }));
  const toast = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.8, 1]) }, { translateY: interpolate(pop.value, [0, 1], [10, 0]) }],
  }));
  const phone = useFloat(float, 6);

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.phone, shadows.raised, phone]}>
        <View style={styles.notch} />
        <Text style={styles.phoneTitle}>{"QR'ı okut"}</Text>

        <View style={styles.viewfinder}>
          <View style={styles.qr}>
            <QRCode value="https://drop.app" size={QR_SIZE - 24} color={colors.ink} backgroundColor="#FFFFFF" />
          </View>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Animated.View style={[styles.scanLine, line]} />
        </View>

        <Text style={styles.phoneHint}>Kasadaki kodu kameraya göster</Text>
      </Animated.View>

      <Animated.View style={[styles.toast, shadows.raised, toast]}>
        <LinearGradient colors={gradients.success} style={styles.toastIcon}>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View>
          <Text style={styles.toastTitle}>Kullanıldı!</Text>
          <Text style={styles.toastSub}>₺45 tasarruf ettin</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/* -------------------------------- 4 · Business ------------------------------ */

const bars = [0.35, 0.5, 0.42, 0.7, 0.58, 0.9, 0.76];
const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

export function BusinessIllustration() {
  const float = useLoop(2600);
  const chipFloat = useLoop(2000, { delay: 400 });

  const panel = useFloat(float, 8, 2);
  const chip = useFloat(chipFloat, 8, -6);
  const cta = useFloat(float, 5, -3);

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.panel, shadows.raised, panel]}>
        <View style={styles.panelHead}>
          <View style={styles.store}>
            <Ionicons name="storefront" size={18} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.panelTitle}>Kahve Durağı</Text>
            <Text style={styles.panelSub}>Moda şubesi</Text>
          </View>
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={styles.verifiedText}>Onaylı</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <MiniStat value="2" label="Yayında" />
          <MiniStat value="18" label="Rezervasyon" />
          <MiniStat value="11" label="Kullanıldı" />
        </View>

        <View style={styles.chart}>
          {bars.map((height, index) => (
            <Bar key={days[index]} height={height} label={days[index]} index={index} highlight={index === 5} />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.growthChip, shadows.raised, chip]}>
        <Ionicons name="trending-up" size={16} color={colors.success} />
        <Text style={styles.growthText}>+18 yeni müşteri</Text>
      </Animated.View>

      <Animated.View style={[styles.ctaWrap, cta]}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cta, shadows.primary]}>
          <Ionicons name="flash" size={15} color={colors.lime} />
          <Text style={styles.ctaText}>Drop Oluştur</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const CHART_HEIGHT = 86;

function Bar({ height, label, index, highlight }: { height: number; label: string; index: number; highlight: boolean }) {
  const grow = useLoop(1800, { delay: index * 120 });
  const style = useAnimatedStyle(() => ({
    height: CHART_HEIGHT * height * interpolate(grow.value, [0, 1], [0.7, 1]),
  }));

  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.bar, highlight && styles.barHighlight, style]} />
      </View>
      <Text style={[styles.barLabel, highlight && styles.barLabelHighlight]}>{label}</Text>
    </View>
  );
}

/* --------------------------------- styles ---------------------------------- */

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 320,
    height: 360,
  },
  flex: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Map
  map: {
    width: 290,
    height: 290,
    overflow: 'hidden',
    backgroundColor: '#1D1540',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  park: {
    position: 'absolute',
    right: -20,
    bottom: -10,
    width: 150,
    height: 110,
    backgroundColor: 'rgba(200,245,60,0.09)',
    borderRadius: 50,
  },
  road: {
    position: 'absolute',
    left: -60,
    width: 420,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roadThin: {
    height: 9,
  },
  me: {
    position: 'absolute',
    top: 137,
    left: 137,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4DA3FF',
  },
  meDot: {
    width: 16,
    height: 16,
    backgroundColor: '#4DA3FF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  pinWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 11,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  pinIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  pinLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  pinTail: {
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  mapChip: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  mapChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  // Card
  dropCard: {
    width: 256,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
  },
  liveText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: colors.ink,
    borderRadius: 8,
  },
  clockText: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 96,
    marginTop: 14,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  heroDeal: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  cardTitle: {
    marginTop: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 8,
    marginTop: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  cardHint: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  claim: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    marginTop: 14,
    borderRadius: radius.md,
  },
  claimText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  sticker: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
    borderRadius: 37,
    ...shadows.raised,
  },
  stickerSmall: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  stickerBig: {
    marginTop: -4,
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
  },

  // Scan
  phone: {
    alignItems: 'center',
    width: 214,
    height: 318,
    paddingTop: 12,
    backgroundColor: '#0B0817',
    borderWidth: 6,
    borderColor: '#2A2345',
    borderRadius: 42,
  },
  notch: {
    width: 70,
    height: 18,
    backgroundColor: '#2A2345',
    borderRadius: 9,
  },
  phoneTitle: {
    marginTop: 18,
    color: colors.textOnDark,
    fontSize: 16,
    fontWeight: '900',
  },
  viewfinder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: QR_SIZE + 20,
    height: QR_SIZE + 20,
    marginTop: 18,
  },
  qr: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: colors.lime,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 3,
    backgroundColor: colors.lime,
    borderRadius: 2,
    shadowColor: colors.lime,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  phoneHint: {
    marginTop: 18,
    paddingHorizontal: 20,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: 18,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  toastIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  toastTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  toastSub: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
  },

  // Business
  panel: {
    width: 272,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  store: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  panelSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  miniStat: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
  },
  miniValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  miniLabel: {
    marginTop: 1,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    justifyContent: 'flex-end',
    width: 22,
    height: CHART_HEIGHT,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primarySoft,
    borderRadius: 7,
  },
  barHighlight: {
    backgroundColor: colors.primary,
  },
  barLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  barLabelHighlight: {
    color: colors.primary,
    fontWeight: '900',
  },
  growthChip: {
    position: 'absolute',
    top: 22,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  growthText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  ctaWrap: {
    position: 'absolute',
    right: 0,
    bottom: 18,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: radius.pill,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
