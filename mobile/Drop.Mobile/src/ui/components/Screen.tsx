import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, isDark } from '../theme';

type Props = PropsWithChildren<{
  edges?: Edge[];
  background?: string;
  statusBar?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}>;

// react-native's SafeAreaView is iOS-only; this one also insets on Android.
export function Screen({
  children,
  edges = ['top', 'bottom'],
  background = colors.bg,
  statusBar = isDark ? 'light' : 'dark',
  style,
}: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }, style]}>
      <StatusBar style={statusBar} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
