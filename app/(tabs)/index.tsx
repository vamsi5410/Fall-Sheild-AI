import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { VitalCard } from '@/components/VitalCard';
import { ECGChart } from '@/components/ECGChart';
import { StatusBanner } from '@/components/StatusBanner';
import { HealthReading, fetchLatestReading } from '@/lib/health-data';

const CARETAKER_PHONE = '911';
const POLL_INTERVAL = 5000;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [reading, setReading] = useState<HealthReading | null>(null);
  const [ecgHistory, setEcgHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);
      const data = await fetchLatestReading();
      setReading(data);
      setEcgHistory((prev) => {
        const next = [...prev, data.ecg];
        return next.length > 50 ? next.slice(-50) : next;
      });
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Connection error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Connecting to sensors...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset + 16,
          paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor={Colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>HealthAI</Text>
          <Text style={styles.headerSub}>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Connecting...'}
          </Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline" size={16} color={Colors.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <StatusBanner reading={reading} caretakerPhone={CARETAKER_PHONE} />

      <View style={styles.vitalsGrid}>
        <VitalCard
          title="Heart Rate"
          value={reading?.heartRate || 0}
          unit="BPM"
          icon="heart"
          iconFamily="ionicons"
          color={Colors.accent}
          isAbnormal={reading ? reading.heartRate > 120 : false}
        />
        <VitalCard
          title="SpO2"
          value={reading?.spo2 || 0}
          unit="%"
          icon="water"
          iconFamily="ionicons"
          color="#4DA6FF"
          isAbnormal={reading ? reading.spo2 < 85 : false}
        />
        <VitalCard
          title="Glucose"
          value={reading?.glucose || 0}
          unit="mg/dL"
          icon="nutrition"
          iconFamily="ionicons"
          color={Colors.warning}
          isAbnormal={reading ? reading.glucose > 200 : false}
        />
        <VitalCard
          title="Temperature"
          value={reading?.temperature || 0}
          unit="F"
          icon="thermometer"
          iconFamily="ionicons"
          color={Colors.success}
        />
      </View>

      <ECGChart ecgValues={ecgHistory} currentValue={reading?.ecg || 0} />

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="pulse" size={14} color={Colors.textMuted} />
          <Text style={styles.infoText}>Channel ID: 3257633</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="refresh-circle" size={14} color={Colors.textMuted} />
          <Text style={styles.infoText}>Every 5s</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.danger + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },
  liveText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.danger,
    letterSpacing: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.warning,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
