import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { type ColorValue, Platform, StyleSheet } from 'react-native';

import { colors, haptics } from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  active: IconName;
  inactive: IconName;
};

function TabIcon({ focused, color, active, inactive }: TabIconProps) {
  return <Ionicons name={focused ? active : inactive} size={24} color={color as string} />;
}

const icon = (active: IconName, inactive: IconName) =>
  function TabBarIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <TabIcon focused={focused} color={color} active={active} inactive={inactive} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptics.tap() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Keşfet', tabBarIcon: icon('compass', 'compass-outline') }} />
      <Tabs.Screen name="claims" options={{ title: "Drop'larım", tabBarIcon: icon('ticket', 'ticket-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    paddingTop: 6,
    ...Platform.select({ android: { height: 64, paddingBottom: 8 } }),
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
