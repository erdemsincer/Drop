import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/ui';
import { mediaUrl } from '@/utils/media';

import { useDropReminders } from '../hooks/useDropReminders';
import type { UpcomingDrop } from '../types/drop';
import { categoryInfo, categoryOf } from '../utils/categories';
import { formatDistance } from '../utils/formatDistance';
import { formatStartsAt } from '../utils/formatStartsAt';
import { dealOf } from '../utils/pricing';

type Props = {
  drops: UpcomingDrop[];
  onOpen: (dropId: string) => void;
};

/** "Coming up" row on the feed: scheduled drops nearby, each with a reminder bell. */
export function UpcomingStrip({ drops, onOpen }: Props) {
  const reminders = useDropReminders();

  if (drops.length === 0) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons name="hourglass" size={16} color={colors.primary} />
        <Text style={styles.title}>Yakında</Text>
        <Text style={styles.subtitle}>Başlayınca haber verelim</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
        {drops.map(drop => {
          const category = categoryInfo[categoryOf(drop.category)];
          const deal = dealOf(drop);
          const on = reminders.isSet(drop.id);

          return (
            <Pressable
              key={drop.id}
              accessibilityRole="button"
              accessibilityLabel={`${drop.businessName}: ${drop.title}, ${formatStartsAt(drop.startsAt)}`}
              onPress={() => onOpen(drop.id)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={[styles.top, { backgroundColor: `${category.tint}22` }]}>
                {drop.photoId ? (
                  <Image source={{ uri: mediaUrl(drop.photoId) }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Ionicons name={category.icon} size={46} color={`${category.tint}88`} />
                )}
                <View style={styles.when}>
                  <Text style={styles.whenText}>{formatStartsAt(drop.startsAt)}</Text>
                </View>
                {deal && (
                  <View style={styles.discount}>
                    <Text style={styles.discountText}>−%{deal.percent}</Text>
                  </View>
                )}
              </View>

              <View style={styles.body}>
                <View style={styles.text}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {drop.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {drop.businessName} · {formatDistance(drop.distanceMeters)}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={on ? 'Hatırlatmayı kapat' : 'Başlayınca hatırlat'}
                  accessibilityState={{ selected: on }}
                  hitSlop={8}
                  onPress={() =>
                    reminders.toggle({
                      id: drop.id,
                      title: drop.title,
                      businessName: drop.businessName,
                      startsAt: drop.startsAt,
                    })
                  }
                  style={[styles.bell, on && styles.bellOn]}
                >
                  <Ionicons name={on ? 'notifications' : 'notifications-outline'} size={17} color={on ? colors.ink : colors.primary} />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {reminders.denied && (
        <Text style={styles.denied}>Hatırlatma için bildirim izni gerekiyor; telefon ayarlarından açabilirsin.</Text>
      )}
    </View>
  );
}

const CARD_WIDTH = 230;

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  scroll: {
    marginHorizontal: -spacing.xl,
    marginTop: spacing.md,
  },
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  top: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  when: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  whenText: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: '800',
  },
  discount: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
  },
  discountText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  text: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  bell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
  },
  bellOn: {
    backgroundColor: colors.lime,
  },
  denied: {
    marginTop: spacing.xs,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
});
