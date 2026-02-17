import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { HealthReading } from '@/lib/health-data';

interface HistoryItemProps {
  reading: HealthReading;
}

export function HistoryItem({ reading }: HistoryItemProps) {
  const isAbnormal = reading.status === 'ABNORMAL';
  const time = new Date(reading.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.container, isAbnormal && styles.abnormalContainer]}>
      <View style={styles.leftSection}>
        <View style={[styles.statusDot, isAbnormal ? styles.dotAbnormal : styles.dotNormal]} />
        <View>
          <Text style={styles.timeText}>{timeStr}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </View>
      <View style={styles.vitals}>
        <View style={styles.vitalItem}>
          <Ionicons name="heart" size={12} color={reading.heartRate > 120 ? Colors.danger : Colors.accent} />
          <Text style={[styles.vitalValue, reading.heartRate > 120 && styles.abnormalText]}>{reading.heartRate}</Text>
        </View>
        <View style={styles.vitalItem}>
          <Ionicons name="water" size={12} color={reading.spo2 < 85 ? Colors.danger : '#4DA6FF'} />
          <Text style={[styles.vitalValue, reading.spo2 < 85 && styles.abnormalText]}>{reading.spo2}%</Text>
        </View>
        <View style={styles.vitalItem}>
          <Ionicons name="nutrition" size={12} color={reading.glucose > 200 ? Colors.danger : Colors.warning} />
          <Text style={[styles.vitalValue, reading.glucose > 200 && styles.abnormalText]}>{reading.glucose}</Text>
        </View>
        <View style={styles.vitalItem}>
          <Ionicons name="thermometer" size={12} color={Colors.success} />
          <Text style={styles.vitalValue}>{reading.temperature}</Text>
        </View>
      </View>
      <View style={[styles.badge, isAbnormal ? styles.badgeAbnormal : styles.badgeNormal]}>
        <Text style={[styles.badgeText, isAbnormal ? styles.badgeTextAbnormal : styles.badgeTextNormal]}>
          {isAbnormal ? 'ALERT' : 'OK'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
  },
  abnormalContainer: {
    borderColor: Colors.danger + '40',
    backgroundColor: Colors.danger + '08',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotNormal: {
    backgroundColor: Colors.success,
  },
  dotAbnormal: {
    backgroundColor: Colors.danger,
  },
  timeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
  vitals: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vitalValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  abnormalText: {
    color: Colors.danger,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeNormal: {
    backgroundColor: Colors.success + '20',
  },
  badgeAbnormal: {
    backgroundColor: Colors.danger + '20',
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  badgeTextNormal: {
    color: Colors.success,
  },
  badgeTextAbnormal: {
    color: Colors.danger,
  },
});
