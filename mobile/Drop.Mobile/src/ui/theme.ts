import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  bg: '#F4F4F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EFF6',
  border: '#E7E6EF',

  ink: '#0E0B1A',
  text: '#14121F',
  textMuted: '#686779',
  textSubtle: '#9C9BAD',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.68)',

  primary: '#6D4AFF',
  primaryPressed: '#5A36F0',
  primarySoft: '#EEE9FF',

  lime: '#C8F53C',

  success: '#12B76A',
  successSoft: '#E6F7EE',
  warning: '#F58A07',
  warningSoft: '#FEF2E1',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
} as const;

export const gradients = {
  primary: ['#8466FF', '#5B37F2'] as const,
  night: ['#231A45', '#120D24'] as const,
  success: ['#1BC47D', '#0E9F62'] as const,
  danger: ['#F26A6A', '#D93A3A'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30 },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600' },
  overline: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
} as const;

const shadow = (color: string, opacity: number, radiusValue: number, y: number, elevation: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radiusValue,
      shadowOffset: { width: 0, height: y },
    },
    default: { elevation },
  })!;

export const shadows = {
  card: shadow('#1B1340', 0.07, 16, 6, 3),
  raised: shadow('#1B1340', 0.14, 24, 12, 8),
  primary: shadow('#6D4AFF', 0.35, 16, 8, 6),
};
