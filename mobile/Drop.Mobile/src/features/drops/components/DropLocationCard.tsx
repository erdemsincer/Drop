import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { DropLogo, colors, radius, shadows, spacing } from '@/ui';
import { openDirections } from '@/utils/openDirections';

import { mapAvailable, regionAround } from '../utils/maps';

type Props = {
  latitude: number;
  longitude: number;
  businessName: string;
  branchName: string;
  tint: string;
};

/** Where the deal is: a still map thumbnail and a one-tap route there. */
export function DropLocationCard({ latitude, longitude, businessName, branchName, tint }: Props) {
  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);
  const directions = () => openDirections(latitude, longitude, `${businessName} ${branchName}`);

  return (
    <View style={styles.card}>
      {mapAvailable && hasPoint && (
        <Pressable accessibilityRole="button" accessibilityLabel="Haritada yol tarifi al" onPress={directions}>
          <MapView
            style={styles.map}
            initialRegion={regionAround(latitude, longitude, 0.35)}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsPointsOfInterests={false}
            pointerEvents="none"
          >
            <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
              <View style={[styles.pin, { backgroundColor: tint }]}>
                <DropLogo size={22} color="#FFFFFF" />
              </View>
            </Marker>
          </MapView>
        </Pressable>
      )}

      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="location" size={20} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.label}>Konum</Text>
          <Text style={styles.value} numberOfLines={1}>
            {businessName} · {branchName}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yol tarifi"
          onPress={directions}
          style={({ pressed }) => [styles.route, pressed && styles.pressed]}
        >
          <Ionicons name="navigate" size={14} color={colors.lime} />
          <Text style={styles.routeText}>Yol tarifi</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  map: {
    height: 140,
  },
  pin: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    marginTop: 2,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 14,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  routeText: {
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
