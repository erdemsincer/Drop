import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, haptics, radius, spacing } from '@/ui';
import { mediaUrl } from '@/utils/media';

import { uploadDropPhoto } from '../api/mediaApi';

type Props = {
  value: string | null;
  onChange: (photoId: string | null) => void;
};

/** Drop photo: take one or pick from the library; it is shrunk and uploaded right away. */
export function PhotoPicker({ value, onChange }: Props) {
  const upload = useMutation({
    mutationFn: ({ uri, width }: { uri: string; width: number }) => uploadDropPhoto(uri, width),
    onSuccess: id => {
      haptics.success();
      onChange(id);
    },
    onError: () => {
      haptics.error();
      Alert.alert('Fotoğraf yüklenemedi', 'Bağlantını kontrol edip tekrar dene.');
    },
  });

  const pick = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'İzin gerekli',
        source === 'camera' ? 'Fotoğraf çekmek için kamera izni ver.' : 'Fotoğraf seçmek için galeri izni ver.',
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 1,
    };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);

    const asset = result.canceled ? null : result.assets[0];
    if (asset) upload.mutate({ uri: asset.uri, width: asset.width });
  };

  const choose = () => {
    haptics.tap();
    Alert.alert('Drop fotoğrafı', 'Ürünün iştah açan bir fotoğrafı, Drop’unu çok daha dikkat çekici yapar.', [
      { text: 'Fotoğraf çek', onPress: () => void pick('camera') },
      { text: 'Galeriden seç', onPress: () => void pick('library') },
      ...(value ? [{ text: 'Fotoğrafı kaldır', style: 'destructive' as const, onPress: () => onChange(null) }] : []),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
      onPress={choose}
      disabled={upload.isPending}
      style={({ pressed }) => [styles.box, !value && styles.empty, pressed && styles.pressed]}
    >
      {value ? (
        <>
          <Image source={{ uri: mediaUrl(value) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <View style={styles.change}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
            <Text style={styles.changeText}>Değiştir</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.icon}>
            <Ionicons name="camera" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Fotoğraf ekle</Text>
          <Text style={styles.hint}>İsteğe bağlı · fotoğraflı Drop’lar daha çok yakalanır</Text>
        </>
      )}

      {upload.isPending && (
        <View style={styles.busy}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.busyText}>Yükleniyor…</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 170,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
  },
  empty: {
    gap: 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  change: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(14,11,26,0.7)',
    borderRadius: radius.pill,
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  busy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(14,11,26,0.55)',
  },
  busyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
