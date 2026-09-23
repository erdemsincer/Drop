import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useActiveClaim } from '@/features/claims/hooks/useActiveClaim';
import { DropCard } from '@/features/drops/components/DropCard';
import { useNearbyDrops } from '@/features/drops/hooks/useNearbyDrops';
import { useCurrentLocation } from '@/features/location/hooks/useCurrentLocation';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { signOut } = useAuth();

  const locationQuery = useCurrentLocation();

  const activeClaimQuery = useActiveClaim();

  const nearbyQuery = useNearbyDrops({
    latitude: locationQuery.data?.latitude,
    longitude: locationQuery.data?.longitude,
    radiusKm: 5,
  });

  const drops = nearbyQuery.data ?? [];

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (locationQuery.isLoading) {
    return (
      <ScreenState>
        <LoadingState text="Konumun alınıyor..." />
      </ScreenState>
    );
  }

  if (locationQuery.isError) {
    return (
      <ScreenState>
        <ErrorState
          icon="⌖"
          title="Konumuna erişemedik"
          description="Yakınındaki fırsatları gösterebilmemiz için konum iznine ihtiyacımız var."
          onRetry={() => locationQuery.refetch()}
        />
      </ScreenState>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundShapeOne} />
      <View style={styles.backgroundShapeTwo} />

      <View style={styles.header}>
        <View style={styles.brandArea}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>
              D
            </Text>
          </View>

          <View>
            <Text style={styles.logo}>
              DROP
            </Text>

            <Text style={styles.logoCaption}>
              Yakala, kullan, kazan
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Çıkış yap"
          style={({ pressed }) => [
            styles.logoutButton,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.logoutIcon}>
            ↗
          </Text>

          <Text style={styles.logout}>
            Çıkış
          </Text>
        </Pressable>
      </View>

      {activeClaimQuery.data && (
        <Pressable
          style={styles.activeClaim}
          onPress={() =>
            router.push({
              pathname:
                '/(app)/claim/[id]',
              params: {
                id:
                  activeClaimQuery.data!
                    .claimId,
                expiresAt:
                  activeClaimQuery.data!
                    .expiresAt,
              },
            })
          }
        >
          <Text
            style={
              styles.activeClaimLabel
            }
          >
            AKTİF DROP
          </Text>

          <Text
            style={
              styles.activeClaimTitle
            }
          >
            {
              activeClaimQuery.data
                .dropTitle
            }
          </Text>

          <Text style={styles.activeClaimCta}>
            Devam etmek için dokun
          </Text>
        </Pressable>
      )}

      {nearbyQuery.isLoading ? (
        <LoadingState text="Yakınındaki Drop'lar aranıyor..." />
      ) : nearbyQuery.isError ? (
        <ErrorState
          icon="!"
          title="Bir şeyler ters gitti"
          description="Drop'lar şu anda yüklenemedi. Biraz sonra tekrar deneyebilirsin."
          onRetry={() => nearbyQuery.refetch()}
        />
      ) : (
        <FlatList
          data={drops}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <DropCard
              drop={item}
              onPress={() =>
                router.push({
                  pathname:
                    '/(app)/drop/[id]',
                  params: {
                    id: item.id,
                  },
                })
              }
            />
          )}
          ListHeaderComponent={
            <HomeListHeader
              dropCount={drops.length}
            />
          }
          ListEmptyComponent={
            <EmptyDrops />
          }
          contentContainerStyle={[
            styles.list,
            drops.length === 0 &&
              styles.emptyList,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          refreshing={
            nearbyQuery.isRefetching
          }
          onRefresh={() =>
            nearbyQuery.refetch()
          }
        />
      )}
    </SafeAreaView>
  );
}

type HomeListHeaderProps = {
  dropCount: number;
};

function HomeListHeader({
  dropCount,
}: HomeListHeaderProps) {
  return (
    <View style={styles.listHeader}>
      <View style={styles.hero}>
        <View style={styles.heroDecorationOne} />
        <View style={styles.heroDecorationTwo} />

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.liveBadgeText}>
            CANLI FIRSATLAR
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Yakınındaki fırsatları{'\n'}
          kaçırma.
        </Text>

        <Text style={styles.heroDescription}>
          Sana 5 km mesafedeki aktif
          Drop&apos;ları keşfet.
        </Text>

        <View style={styles.heroFooter}>
          <View>
            <Text style={styles.resultNumber}>
              {dropCount}
            </Text>

            <Text style={styles.resultLabel}>
              aktif Drop
            </Text>
          </View>

          <View style={styles.locationBadge}>
            <Text style={styles.locationIcon}>
              ◉
            </Text>

            <Text style={styles.locationText}>
              5 km çevrende
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Şu an yakınında
          </Text>

          <Text style={styles.sectionDescription}>
            Sana en yakın fırsatlar
          </Text>
        </View>

        {dropCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {dropCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

type ScreenStateProps = {
  children: React.ReactNode;
};

function ScreenState({
  children,
}: ScreenStateProps) {
  return (
    <SafeAreaView style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

type LoadingStateProps = {
  text: string;
};

function LoadingState({
  text,
}: LoadingStateProps) {
  return (
    <View style={styles.center}>
      <View style={styles.loadingCircle}>
        <ActivityIndicator
          size="large"
          color="#6C5CE7"
        />
      </View>

      <Text style={styles.loadingTitle}>
        Bir saniye...
      </Text>

      <Text style={styles.loadingText}>
        {text}
      </Text>
    </View>
  );
}

type ErrorStateProps = {
  icon: string;
  title: string;
  description: string;
  onRetry: () => void;
};

function ErrorState({
  icon,
  title,
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <View style={styles.stateIconContainer}>
        <Text style={styles.stateIcon}>
          {icon}
        </Text>
      </View>

      <Text style={styles.stateTitle}>
        {title}
      </Text>

      <Text style={styles.stateText}>
        {description}
      </Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.retryButtonText}>
          Tekrar dene
        </Text>

        <Text style={styles.retryArrow}>
          →
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyDrops() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyBackCircle} />

        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>
            ☕
          </Text>
        </View>

        <View style={styles.emptyDotOne} />
        <View style={styles.emptyDotTwo} />
      </View>

      <Text style={styles.stateTitle}>
        Buralar şimdilik sakin
      </Text>

      <Text style={styles.stateText}>
        Yakınındaki işletmeler yeni
        fırsatlar oluşturduğunda hepsini
        burada göreceksin.
      </Text>

      <View style={styles.emptyHint}>
        <Text style={styles.emptyHintIcon}>
          ↻
        </Text>

        <Text style={styles.emptyHintText}>
          Yenilemek için aşağı çek
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  backgroundShapeOne: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    backgroundColor: '#EFECFF',
    borderRadius: 125,
    opacity: 0.65,
  },

  backgroundShapeTwo: {
    position: 'absolute',
    top: 170,
    left: -80,
    width: 160,
    height: 160,
    backgroundColor: '#E9F9F1',
    borderRadius: 80,
    opacity: 0.55,
  },

  header: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoMark: {
    width: 43,
    height: 43,
    marginRight: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 14,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,

    elevation: 5,
  },

  logoMarkText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  logo: {
    color: '#171A24',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  logoCaption: {
    marginTop: 1,
    color: '#898E9B',
    fontSize: 10,
    fontWeight: '600',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#E6E8EF',
    borderRadius: 20,
  },

  logoutIcon: {
    marginRight: 5,
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '800',
    transform: [{ rotate: '45deg' }],
  },

  logout: {
    color: '#4A4E5B',
    fontSize: 12,
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  emptyList: {
    flexGrow: 1,
  },

  listHeader: {
    marginBottom: 4,
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 28,
    padding: 22,
    backgroundColor: '#252238',
    borderRadius: 27,

    shadowColor: '#1C1930',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,

    elevation: 7,
  },

  heroDecorationOne: {
    position: 'absolute',
    top: -45,
    right: -35,
    width: 145,
    height: 145,
    backgroundColor: '#6C5CE7',
    borderRadius: 73,
    opacity: 0.7,
  },

  heroDecorationTwo: {
    position: 'absolute',
    top: 40,
    right: 55,
    width: 65,
    height: 65,
    backgroundColor: '#A99CFF',
    borderRadius: 33,
    opacity: 0.18,
  },

  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
  },

  liveDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    backgroundColor: '#47E49B',
    borderRadius: 4,
  },

  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  heroTitle: {
    marginTop: 17,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.8,
  },

  heroDescription: {
    maxWidth: 240,
    marginTop: 9,
    color: '#C9C6D8',
    fontSize: 13,
    lineHeight: 19,
  },

  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 23,
  },

  resultNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  resultLabel: {
    marginTop: 1,
    color: '#AAA6BD',
    fontSize: 11,
    fontWeight: '600',
  },

  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },

  locationIcon: {
    marginRight: 6,
    color: '#6C5CE7',
    fontSize: 10,
  },

  locationText: {
    color: '#363244',
    fontSize: 11,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    color: '#181B25',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionDescription: {
    marginTop: 4,
    color: '#9296A2',
    fontSize: 12,
    fontWeight: '500',
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEAFF',
    borderRadius: 17,
  },

  countText: {
    color: '#6C5CE7',
    fontSize: 13,
    fontWeight: '900',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 50,
  },

  loadingCircle: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.13,
    shadowRadius: 18,

    elevation: 5,
  },

  loadingTitle: {
    marginTop: 23,
    color: '#20232D',
    fontSize: 19,
    fontWeight: '800',
  },

  loadingText: {
    marginTop: 7,
    color: '#858A97',
    fontSize: 14,
    textAlign: 'center',
  },

  stateIconContainer: {
    width: 76,
    height: 76,
    marginBottom: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEAFF',
    borderRadius: 25,
  },

  stateIcon: {
    color: '#6C5CE7',
    fontSize: 33,
    fontWeight: '900',
  },

  stateTitle: {
    color: '#20232D',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  stateText: {
    maxWidth: 320,
    marginTop: 9,
    color: '#7D828F',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 23,
    paddingHorizontal: 21,
    paddingVertical: 13,
    backgroundColor: '#6C5CE7',
    borderRadius: 15,

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 5,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  retryArrow: {
    marginLeft: 9,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  emptyIllustration: {
    position: 'relative',
    width: 130,
    height: 125,
    marginBottom: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBackCircle: {
    position: 'absolute',
    width: 118,
    height: 118,
    backgroundColor: '#EDEAFF',
    borderRadius: 59,
  },

  emptyIconContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    transform: [{ rotate: '-5deg' }],

    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 15,

    elevation: 4,
  },

  emptyIcon: {
    fontSize: 37,
  },

  emptyDotOne: {
    position: 'absolute',
    top: 7,
    right: 2,
    width: 15,
    height: 15,
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
  },

  emptyDotTwo: {
    position: 'absolute',
    bottom: 9,
    left: 5,
    width: 10,
    height: 10,
    backgroundColor: '#47D89A',
    borderRadius: 5,
  },

  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 21,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E9EF',
    borderRadius: 18,
  },

  emptyHintIcon: {
    marginRight: 6,
    color: '#6C5CE7',
    fontSize: 15,
    fontWeight: '800',
  },

  emptyHintText: {
    color: '#747986',
    fontSize: 11,
    fontWeight: '700',
  },

  activeClaim: {
    marginHorizontal: 20,
    marginVertical: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#111',
    borderRadius: 14,
  },

  activeClaimLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },

  activeClaimTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },

  activeClaimCta: {
    marginTop: 10,
    fontSize: 12,
    color: '#ccc',
  },
});