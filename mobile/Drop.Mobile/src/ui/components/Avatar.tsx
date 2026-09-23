import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

const palettes = [
  ['#8466FF', '#5B37F2'],
  ['#FF8A4C', '#F2542D'],
  ['#1BC47D', '#0E9F62'],
  ['#3AA8FF', '#1570EF'],
  ['#F45DB3', '#D0348A'],
] as const;

// Stable colour per name so a business always gets the same avatar.
const pick = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
};

type Props = {
  name: string;
  size?: number;
};

export function Avatar({ name, size = 44 }: Props) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('tr-TR') || '•';

  return (
    <LinearGradient
      colors={pick(name)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.32 }]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.44 }]}>{initial}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
