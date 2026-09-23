import { Alert, Linking, Platform } from 'react-native';

/** Opens turn-by-turn directions in the platform's maps app. */
export const openDirections = async (latitude: number, longitude: number, label?: string) => {
  const destination = `${latitude},${longitude}`;
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${destination}${label ? `&q=${encodeURIComponent(label)}` : ''}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Harita açılamadı', 'Cihazında bir harita uygulaması bulunamadı.');
  }
};
