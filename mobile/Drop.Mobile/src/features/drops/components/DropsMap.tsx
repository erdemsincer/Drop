import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { colors, haptics, radius, shadows, spacing } from '@/ui';

import { useCountdown } from '../hooks/useCountdown';
import type { NearbyDrop } from '../types/drop';
import { categoryInfo, categoryOf } from '../utils/categories';
import { formatDistance } from '../utils/formatDistance';
import { regionAround } from '../utils/maps';

type Props = {
  drops: NearbyDrop[];
  latitude: number;
  longitude: number;
  radiusKm: number;
  onOpenDrop: (dropId: string) => void;
};

type BranchPin = {
  branchId: string;
  latitude: number;
  longitude: number;
  drops: NearbyDrop[];
};

/** One pin per branch: a café with three live drops is one place on the map. */
const groupByBranch = (drops: NearbyDrop[]): BranchPin[] => {
  const pins = new Map<string, BranchPin>();

  for (const drop of drops) {
    // An older server omits coordinates; a marker without them would crash the native map.
    if (!Number.isFinite(drop.latitude) || !Number.isFinite(drop.longitude)) continue;

    const pin = pins.get(drop.branchId);
    if (pin) pin.drops.push(drop);
    else pins.set(drop.branchId, { branchId: drop.branchId, latitude: drop.latitude, longitude: drop.longitude, drops: [drop] });
  }

  return [...pins.values()];
};

export function DropsMap({ drops, latitude, longitude, radiusKm, onOpenDrop }: Props) {
  const mapRef = useRef<MapView>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const pins = groupByBranch(drops);
  const selected = pins.find(pin => pin.branchId === selectedBranchId) ?? null;

  // Follow the radius chips: zoom so the whole search circle is in view.
  useEffect(() => {
    mapRef.current?.animateToRegion(regionAround(latitude, longitude, radiusKm), 350);
  }, [latitude, longitude, radiusKm]);

  const recenter = () => {
    haptics.tap();
    setSelectedBranchId(null);
    mapRef.current?.animateToRegion(regionAround(latitude, longitude, radiusKm), 350);
  };

  const select = (pin: BranchPin) => {
    haptics.tap();
    setSelectedBranchId(pin.branchId);
    mapRef.current?.animateCamera({ center: { latitude: pin.latitude, longitude: pin.longitude } }, { duration: 300 });
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regionAround(latitude, longitude, radiusKm)}
        showsUserLocation
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        onPress={() => setSelectedBranchId(null)}
      >
        <Circle
          center={{ latitude, longitude }}
          radius={radiusKm * 1000}
          strokeWidth={1.5}
          strokeColor="rgba(109,74,255,0.45)"
          fillColor="rgba(109,74,255,0.06)"
        />

        {pins.map(pin => {
          const isSelected = pin.branchId === selectedBranchId;

          return (
            <Marker
              // Re-keyed on selection so the frozen marker view redraws with its new look.
              key={`${pin.branchId}:${isSelected ? 1 : 0}:${pin.drops.length}`}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              zIndex={isSelected ? 10 : 1}
              onPress={event => {
                event.stopPropagation();
                select(pin);
              }}
            >
              <Pin drops={pin.drops} selected={isSelected} />
            </Marker>
          );
        })}
      </MapView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Konumuma dön"
        onPress={recenter}
        style={({ pressed }) => [styles.recenter, pressed && styles.pressed, selected && styles.recenterRaised]}
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
      </Pressable>

      {selected ? (
        <Animated.View key={selected.branchId} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(160)} style={styles.sheet}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - spacing.xl * 2 + spacing.md}
            decelerationRate="fast"
            contentContainerStyle={styles.cards}
          >
            {selected.drops.map(drop => (
              <MapDropCard
                key={drop.id}
                drop={drop}
                width={selected.drops.length > 1 ? width - spacing.xl * 2 - 24 : width - spacing.xl * 2}
                onPress={() => onOpenDrop(drop.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      ) : (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>
            {drops.length === 0
              ? `${radiusKm} km içinde şu an Drop yok`
              : `${drops.length} Drop · görmek için bir pine dokun`}
          </Text>
        </View>
      )}
    </View>
  );
}

function Pin({ drops, selected }: { drops: NearbyDrop[]; selected: boolean }) {
  const lead = categoryInfo[categoryOf(drops[0].category)];
  const soldOut = drops.every(drop => drop.remainingCapacity <= 0);
  const size = selected ? 46 : 38;

  return (
    <View style={styles.pinWrap}>
      <View
        style={[
          styles.pin,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: soldOut ? colors.textSubtle : lead.tint },
          selected && styles.pinSelected,
        ]}
      >
        <Ionicons name={lead.icon} size={selected ? 22 : 18} color="#FFFFFF" />
        {drops.length > 1 && (
          <View style={styles.count}>
            <Text style={styles.countText}>{drops.length}</Text>
          </View>
        )}
      </View>
      <View style={[styles.tail, { borderTopColor: selected ? colors.lime : soldOut ? colors.textSubtle : lead.tint }]} />
    </View>
  );
}

function MapDropCard({ drop, width, onPress }: { drop: NearbyDrop; width: number; onPress: () => void }) {
  const remaining = useCountdown(drop.endsAt);
  const category = categoryInfo[categoryOf(drop.category)];
  const soldOut = drop.remainingCapacity <= 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${drop.businessName}: ${drop.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={[styles.cardIcon, { backgroundColor: category.tint }]}>
        <Ionicons name={category.icon} size={22} color="#FFFFFF" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardBusiness} numberOfLines={1}>
          {drop.businessName} · {formatDistance(drop.distanceMeters)}
        </Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {drop.title}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.cardMetaText}>{remaining.isExpired ? 'Sona erdi' : remaining.label}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={[styles.cardMetaText, soldOut ? styles.soldOut : drop.remainingCapacity <= 3 && styles.lowStock]}>
            {soldOut ? 'Tükendi' : `${drop.remainingCapacity} yer kaldı`}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    marginTop: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  pressed: {
    opacity: 0.85,
  },
  pinWrap: {
    alignItems: 'center',
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...shadows.card,
  },
  pinSelected: {
    borderColor: colors.lime,
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  count: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
  },
  countText: {
    color: colors.textOnDark,
    fontSize: 11,
    fontWeight: '900',
  },
  recenter: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 72,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 23,
    ...shadows.raised,
  },
  recenterRaised: {
    bottom: 150,
  },
  hint: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    ...shadows.raised,
  },
  hintText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '700',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
  },
  cards: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.raised,
  },
  cardIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  cardBody: {
    flex: 1,
  },
  cardBusiness: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    marginTop: 2,
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardMetaText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardDot: {
    color: colors.textSubtle,
  },
  lowStock: {
    color: colors.danger,
  },
  soldOut: {
    color: colors.textSubtle,
  },
});
