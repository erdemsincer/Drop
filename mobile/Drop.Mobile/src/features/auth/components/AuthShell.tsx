import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, radius, shadows, spacing, typography } from '@/ui';

type Props = PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function AuthShell({ eyebrow, title, subtitle, footer, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        >
          <LinearGradient
            colors={gradients.night}
            style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
          >
            <View style={styles.orbOne} />
            <View style={styles.orbTwo} />

            <View style={styles.brand}>
              <LinearGradient colors={gradients.primary} style={styles.logoMark}>
                <Ionicons name="flash" size={20} color={colors.lime} />
              </LinearGradient>
              <Text style={styles.logo}>drop</Text>
            </View>

            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </LinearGradient>

          <View style={styles.sheet}>{children}</View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: spacing.xxl,
    paddingBottom: 72,
  },
  orbOne: {
    position: 'absolute',
    top: -60,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },
  orbTwo: {
    position: 'absolute',
    bottom: 10,
    right: 60,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.lime,
    opacity: 0.12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.xxxl,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: colors.textOnDark,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.lime,
  },
  title: {
    ...typography.display,
    marginTop: spacing.sm,
    color: colors.textOnDark,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textOnDarkMuted,
  },
  sheet: {
    gap: spacing.lg,
    marginTop: -44,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.raised,
  },
});
