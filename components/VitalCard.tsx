import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface VitalCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
  iconFamily: 'ionicons' | 'material-community';
  color: string;
  isAbnormal?: boolean;
}

export function VitalCard({ title, value, unit, icon, iconFamily, color, isAbnormal }: VitalCardProps) {
  const scale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  useEffect(() => {
    if (isAbnormal) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [isAbnormal]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const IconComponent = iconFamily === 'ionicons' ? Ionicons : MaterialCommunityIcons;

  return (
    <Animated.View style={[styles.card, animatedStyle, isAbnormal && styles.cardAbnormal]}>
      <Animated.View style={pulseStyle}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <IconComponent name={icon as any} size={22} color={color} />
        </View>
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {isAbnormal && (
        <View style={styles.alertBadge}>
          <Ionicons name="warning" size={10} color="#FFF" />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    width: '48%' as any,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
  },
  cardAbnormal: {
    borderColor: Colors.danger + '60',
    backgroundColor: Colors.danger + '08',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  unit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  alertBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
