import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, haptics, radius, spacing } from '@/ui';

import { type Badge, infoFor } from '../api/badgeApi';

/** The collection: earned badges in colour, the rest greyed with how far along you are. */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  // Earned first, then the closest to earning.
  const sorted = [...badges].sort(
    (a, b) => Number(b.earned) - Number(a.earned) || b.progress / b.target - a.progress / a.target,
  );

  return (
    <View style={styles.grid}>
      {sorted.map(badge => {
        const info = infoFor(badge.id);
        const ratio = Math.min(1, badge.progress / Math.max(1, badge.target));

        return (
          <Pressable
            key={badge.id}
            accessibilityRole="button"
            accessibilityLabel={`${info.title}${badge.earned ? ', kazanıldı' : `, ${badge.progress}/${badge.target}`}`}
            onPress={() => {
              haptics.tap();
              Alert.alert(
                `${info.title}${badge.earned ? ' 🏅' : ''}`,
                badge.earned
                  ? `${info.description}${badge.earnedAt ? `\n\nKazanıldı: ${new Date(badge.earnedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}` : ''}`
                  : `${info.description}\n\nİlerleme: ${badge.progress} / ${badge.target}`,
              );
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.medal, { backgroundColor: badge.earned ? info.color : colors.surfaceMuted }]}>
              <Ionicons name={info.icon} size={24} color={badge.earned ? '#FFFFFF' : colors.textSubtle} />
            </View>
            <Text style={[styles.title, !badge.earned && styles.titleLocked]} numberOfLines={1}>
              {info.title}
            </Text>
            {!badge.earned && (
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: info.color }]} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    rowGap: spacing.lg,
  },
  item: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  medal: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
  },
  title: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  titleLocked: {
    color: colors.textMuted,
  },
  track: {
    width: 40,
    height: 4,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
  },
  fill: {
    height: '100%',
  },
});
