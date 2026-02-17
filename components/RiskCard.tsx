import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { HealthRisk } from '@/lib/health-data';

interface RiskCardProps {
  risk: HealthRisk;
  index: number;
}

const RISK_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  heart: { bg: '#FF4D6A15', text: Colors.accent, icon: Colors.accent },
  respiratory: { bg: '#4DA6FF15', text: '#4DA6FF', icon: '#4DA6FF' },
  diabetes: { bg: '#FFB80015', text: Colors.warning, icon: Colors.warning },
  fever: { bg: '#FF6B3515', text: '#FF6B35', icon: '#FF6B35' },
  fall: { bg: '#FF3D7115', text: Colors.danger, icon: Colors.danger },
};

const ICON_MAP: Record<string, { name: string; family: 'mci' | 'ion' }> = {
  'heart-pulse': { name: 'heart-pulse', family: 'mci' },
  'lungs': { name: 'lungs', family: 'mci' },
  'water': { name: 'water', family: 'ion' },
  'thermometer-alert': { name: 'thermometer-alert', family: 'mci' },
  'alert-circle': { name: 'alert-circle', family: 'ion' },
};

export function RiskCard({ risk, index }: RiskCardProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withTiming(1, { duration: 300 });
    }, delay);

    if (risk.severity === 'critical') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const colors = RISK_COLORS[risk.type] || RISK_COLORS.heart;
  const iconDef = ICON_MAP[risk.icon] || { name: 'alert-circle', family: 'ion' as const };

  return (
    <Animated.View style={[styles.container, containerStyle, { backgroundColor: colors.bg, borderColor: colors.text + '30' }]}>
      <Animated.View style={[styles.iconRow, pulseStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.text + '20' }]}>
          {iconDef.family === 'mci' ? (
            <MaterialCommunityIcons name={iconDef.name as any} size={18} color={colors.icon} />
          ) : (
            <Ionicons name={iconDef.name as any} size={18} color={colors.icon} />
          )}
        </View>
        <View style={[styles.severityBadge, risk.severity === 'critical' ? styles.criticalBadge : styles.warningBadge]}>
          <Text style={[styles.severityText, risk.severity === 'critical' ? styles.criticalText : styles.warningText]}>
            {risk.severity.toUpperCase()}
          </Text>
        </View>
      </Animated.View>
      <Text style={[styles.title, { color: colors.text }]}>{risk.title}</Text>
      <View style={styles.indicators}>
        {risk.indicators.map((ind, i) => (
          <View key={i} style={styles.indicatorRow}>
            <View style={[styles.indicatorDot, { backgroundColor: colors.text }]} />
            <Text style={styles.indicatorText}>{ind}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    width: '48%' as any,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalBadge: {
    backgroundColor: Colors.danger + '30',
  },
  warningBadge: {
    backgroundColor: Colors.warning + '30',
  },
  severityText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  criticalText: {
    color: Colors.danger,
  },
  warningText: {
    color: Colors.warning,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 6,
  },
  indicators: {
    gap: 3,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  indicatorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
