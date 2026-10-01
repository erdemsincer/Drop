import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, haptics, radius, shadows, spacing } from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabs: Record<string, { label: string; active: IconName; inactive: IconName }> = {
  index: { label: 'Keşfet', active: 'compass', inactive: 'compass-outline' },
  claims: { label: "Drop'larım", active: 'ticket', inactive: 'ticket-outline' },
  profile: { label: 'Profil', active: 'person', inactive: 'person-outline' },
};

/** A pill bar: the selected tab grows into a dark capsule with its name, the rest stay icons. */
function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const tab = tabs[route.name];
          if (!tab) return null;

          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (focused || event.defaultPrevented) return;
            haptics.tap();
            navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={styles.slot}
            >
              <Animated.View
                layout={LinearTransition.springify().damping(18)}
                style={[styles.tab, focused && styles.tabFocused]}
              >
                <Ionicons
                  name={focused ? tab.active : tab.inactive}
                  size={22}
                  color={focused ? colors.lime : colors.textSubtle}
                />
                {focused && (
                  <Animated.Text entering={FadeIn.duration(180)} style={styles.label} numberOfLines={1}>
                    {tab.label}
                  </Animated.Text>
                )}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="claims" options={{ title: "Drop'larım" }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.raised,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  tabFocused: {
    paddingHorizontal: 18,
    backgroundColor: colors.ink,
  },
  label: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '800',
  },
});
