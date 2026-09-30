import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, haptics, radius } from '@/ui';

import { useFollows, useToggleFollow } from '../hooks/useFollows';

type Props = {
  businessId: string;
  businessName: string;
};

/** Glass pill for dark headers: "Takip et" / "Takipte". */
export function FollowButton({ businessId, businessName }: Props) {
  const followsQuery = useFollows();
  const toggle = useToggleFollow();

  if (!followsQuery.data) return null;

  const following = followsQuery.data.some(follow => follow.businessId === businessId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: following }}
      accessibilityLabel={following ? `${businessName} takibini bırak` : `${businessName} işletmesini takip et`}
      hitSlop={6}
      disabled={toggle.isPending}
      onPress={() => {
        haptics.tap();
        toggle.mutate({ businessId, name: businessName, follow: !following });
      }}
      style={({ pressed }) => [styles.pill, following && styles.pillFollowing, pressed && styles.pressed]}
    >
      <Ionicons
        name={following ? 'notifications' : 'notifications-outline'}
        size={14}
        color={following ? colors.ink : colors.textOnDark}
      />
      <Text style={[styles.label, following && styles.labelFollowing]}>{following ? 'Takipte' : 'Takip et'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
  },
  pillFollowing: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: '800',
  },
  labelFollowing: {
    color: colors.ink,
  },
});
