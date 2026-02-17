import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { HealthReading, generateWhatsAppUrl, getAbnormalReasons } from '@/lib/health-data';

interface StatusBannerProps {
  reading: HealthReading | null;
  caretakerPhone: string;
}

export function StatusBanner({ reading, caretakerPhone }: StatusBannerProps) {
  const bgOpacity = useSharedValue(1);
  const slideUp = useSharedValue(20);

  useEffect(() => {
    slideUp.value = withSpring(0, { damping: 15 });
  }, []);

  useEffect(() => {
    if (reading?.status === 'ABNORMAL') {
      bgOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      bgOpacity.value = withTiming(1);
    }
  }, [reading?.status]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  if (!reading) return null;

  const isAbnormal = reading.status === 'ABNORMAL';
  const reasons = isAbnormal ? getAbnormalReasons(reading.heartRate, reading.spo2, reading.glucose) : [];

  const handleAlert = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    const url = generateWhatsAppUrl(caretakerPhone, reading);
    try {
      await Linking.openURL(url);
    } catch {
      console.log('Could not open WhatsApp');
    }
  };

  return (
    <Animated.View style={containerStyle}>
      <Animated.View
        style={[
          styles.container,
          isAbnormal ? styles.abnormal : styles.normal,
          pulseStyle,
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.dot, isAbnormal ? styles.dotAbnormal : styles.dotNormal]} />
          <View style={styles.textContainer}>
            <Text style={styles.statusLabel}>Patient Status</Text>
            <Text style={[styles.statusText, isAbnormal ? styles.textAbnormal : styles.textNormal]}>
              {reading.status}
            </Text>
            {reasons.length > 0 && (
              <Text style={styles.reasonText}>{reasons.join(' | ')}</Text>
            )}
          </View>
          {isAbnormal && (
            <Pressable
              onPress={handleAlert}
              style={({ pressed }) => [styles.alertBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  normal: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '40',
  },
  abnormal: {
    backgroundColor: Colors.danger + '15',
    borderColor: Colors.danger + '40',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotNormal: {
    backgroundColor: Colors.success,
  },
  dotAbnormal: {
    backgroundColor: Colors.danger,
  },
  textContainer: {
    flex: 1,
  },
  statusLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  textNormal: {
    color: Colors.success,
  },
  textAbnormal: {
    color: Colors.danger,
  },
  reasonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.danger,
    marginTop: 4,
  },
  alertBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
