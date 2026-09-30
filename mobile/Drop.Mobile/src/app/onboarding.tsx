import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentType, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BusinessIllustration,
  DropCardIllustration,
  MapIllustration,
  ScanIllustration,
} from '@/features/onboarding/components/Illustrations';
import { onboardingStorage } from '@/storage/onboardingStorage';
import { BrandMark, Button, colors, haptics, spacing } from '@/ui';

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  glow: string;
  Illustration: ComponentType;
};

const slides: Slide[] = [
  {
    key: 'discover',
    eyebrow: 'KEŞFET',
    title: 'Yakınındaki fırsatlar,\ntam şu an.',
    body: 'Çevrendeki kafe, restoran ve dükkanların anlık indirimlerini haritada gör.',
    accent: colors.lime,
    glow: '#6D4AFF',
    Illustration: MapIllustration,
  },
  {
    key: 'claim',
    eyebrow: 'YAKALA',
    title: 'Süre de kontenjan da\nsınırlı.',
    body: "Beğendiğin Drop'u tek dokunuşla ayır, süre dolmadan işletmeye git.",
    accent: '#FF9A6B',
    glow: '#F2453D',
    Illustration: DropCardIllustration,
  },
  {
    key: 'redeem',
    eyebrow: 'KULLAN',
    title: 'Kasada okut,\nindirimi kap.',
    body: "İşletmedeki QR kodu okut, Drop'un anında onaylansın. Kupon yok, kod yok, uğraş yok.",
    accent: '#5BE3A4',
    glow: '#12B76A',
    Illustration: ScanIllustration,
  },
  {
    key: 'business',
    eyebrow: 'İŞLETMELER İÇİN',
    title: 'Boş saatlerini\nmüşteriyle doldur.',
    body: 'İşletmeni kaydet, dakikalar içinde Drop yayınla. Yakındaki müşteriler anında görsün.',
    accent: colors.lime,
    glow: '#8466FF',
    Illustration: BusinessIllustration,
  },
];

export default function OnboardingScreen() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;
  const accent = slides[index].accent;

  const onScroll = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  };

  const finish = async (destination: '/(auth)/register' | '/(auth)/login') => {
    haptics.press();
    await onboardingStorage.markSeen();

    // Replayed from the profile: just go back to where the user came from.
    if (replay && router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(destination);
  };

  const glow = useAnimatedStyle(() => {
    const input = slides.map((_, i) => i * width);
    return {
      backgroundColor: interpolateColor(scrollX.value, input, slides.map(slide => slide.glow)),
      transform: [{ translateX: interpolate(scrollX.value, [0, width * (slides.length - 1)], [40, -40]) }],
    };
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <Animated.View style={[styles.glow, glow]} />
      <Animated.View style={[styles.glowSmall, glow]} />
      <View style={styles.veil} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <BrandMark size={32} />
        {!isLast && (
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => {
              haptics.tap();
              goTo(slides.length - 1);
            }}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <Text style={styles.skipText}>Atla</Text>
          </Pressable>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={event => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== index) haptics.tap();
          setIndex(next);
        }}
        style={styles.pager}
      >
        {slides.map((slide, i) => (
          <SlideView key={slide.key} slide={slide} index={i} width={width} scrollX={scrollX} artScale={artScaleFor(height)} />
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Dot key={slide.key} index={i} width={width} scrollX={scrollX} color={accent} />
          ))}
        </View>

        {isLast ? (
          <Animated.View key="final" entering={FadeInDown.duration(320)} style={styles.finalActions}>
            <Button title="Hemen başla" trailingIcon="arrow-forward" onPress={() => void finish('/(auth)/register')} />
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void finish('/(auth)/login')}
              style={({ pressed }) => [styles.login, pressed && styles.pressed]}
            >
              <Text style={styles.loginText}>
                Zaten hesabın var mı? <Text style={styles.loginAction}>Giriş yap</Text>
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View key="next" entering={FadeIn.duration(220)}>
            <Button title="İleri" trailingIcon="arrow-forward" onPress={() => goTo(index + 1)} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const ART_HEIGHT = 360;

// Illustrations are drawn for ~800pt tall screens; shrink them on smaller phones.
const artScaleFor = (screenHeight: number) => Math.min(1, Math.max(0.68, (screenHeight - 420) / 400));

type SlideProps = {
  slide: Slide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  artScale: number;
};

function SlideView({ slide, index, width, scrollX, artScale }: SlideProps) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];
  const { Illustration } = slide;

  // Parallax: the art lags behind the page and settles last, the copy leads it.
  const art = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(scrollX.value, range, [width * 0.45, 0, -width * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, range, [0.8, 1, 0.8], Extrapolation.CLAMP) },
    ],
  }));

  const copy = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(scrollX.value, range, [-width * 0.2, 0, width * 0.2], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.art, art]}>
        <View
          style={{
            transform: [{ scale: artScale }],
            marginVertical: (-ART_HEIGHT * (1 - artScale)) / 2,
          }}
        >
          <Illustration />
        </View>
      </Animated.View>

      <Animated.View style={[styles.copy, copy]}>
        <Text style={[styles.eyebrow, { color: slide.accent }]}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, width, scrollX, color }: { index: number; width: number; scrollX: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / width - index);
    const t = Math.max(0, 1 - distance);
    return {
      width: 8 + 20 * t,
      opacity: 0.3 + 0.7 * t,
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0E0A1F',
  },
  glow: {
    position: 'absolute',
    top: -180,
    alignSelf: 'center',
    width: 520,
    height: 520,
    borderRadius: 260,
    opacity: 0.45,
  },
  glowSmall: {
    position: 'absolute',
    bottom: 120,
    left: -140,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.16,
  },
  // Softens the glow into the background so it reads as light, not a disc.
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14,10,31,0.35)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  skip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
  },
  skipText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  art: {
    alignItems: 'center',
  },
  copy: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.textOnDark,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 38,
  },
  body: {
    marginTop: spacing.md,
    color: colors.textOnDarkMuted,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 23,
  },
  footer: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  finalActions: {
    gap: spacing.sm,
  },
  login: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  loginText: {
    color: colors.textOnDarkMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  loginAction: {
    color: colors.textOnDark,
    fontWeight: '800',
  },
});
