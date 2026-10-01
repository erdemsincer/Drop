import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, colors, haptics, spacing } from '@/ui';
import { mediaUrl } from '@/utils/media';

import type { NearbyDrop } from '../types/drop';
import { categoryInfo, categoryOf } from '../utils/categories';
import { MysteryBox } from './MysteryBox';

type Props = {
  drops: NearbyDrop[];
  onOpen: (index: number) => void;
};

const SIZE = 66;

/** Story-style circles at the top of the feed; each opens the full-screen stories at that drop. */
export function StoryRings({ drops, onOpen }: Props) {
  if (drops.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.row}>
      {drops.map((drop, index) => {
        const tint = categoryInfo[categoryOf(drop.category)].tint;
        const soldOut = drop.remainingCapacity <= 0;

        return (
          <Pressable
            key={drop.id}
            accessibilityRole="button"
            accessibilityLabel={`${drop.businessName}: ${drop.title}`}
            onPress={() => {
              haptics.tap();
              onOpen(index);
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={soldOut ? [colors.border, colors.border] : [colors.lime, tint, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ring}
            >
              <View style={styles.gap}>
                {drop.isLocked ? (
                  <MysteryBox size={SIZE - 14} />
                ) : drop.photoId ? (
                  <Image source={{ uri: mediaUrl(drop.photoId) }} style={styles.photo} contentFit="cover" />
                ) : (
                  <Avatar name={drop.businessName} size={SIZE - 10} />
                )}
              </View>
            </LinearGradient>
            <Text style={styles.label} numberOfLines={1}>
              {drop.businessName}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.xl,
  },
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  item: {
    width: SIZE + 6,
    alignItems: 'center',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  ring: {
    width: SIZE + 6,
    height: SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (SIZE + 6) / 2,
  },
  gap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderRadius: SIZE / 2,
  },
  photo: {
    width: SIZE - 8,
    height: SIZE - 8,
    borderRadius: (SIZE - 8) / 2,
  },
  label: {
    marginTop: 5,
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
