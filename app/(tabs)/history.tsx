import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { HistoryItem } from '@/components/HistoryItem';
import { HealthReading, fetchRecentReadings } from '@/lib/health-data';

type FilterType = 'all' | 'abnormal';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await fetchRecentReadings();
      setReadings(data);
    } catch (e) {
      console.log('Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredReadings = filter === 'abnormal'
    ? readings.filter((r) => r.status === 'ABNORMAL')
    : readings;

  const abnormalCount = readings.filter((r) => r.status === 'ABNORMAL').length;
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset + 16 }]}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>
          {readings.length} readings | {abnormalCount} alerts
        </Text>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.filterBtn, filter === 'all' && styles.filterActive]}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({readings.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('abnormal')}
          style={[styles.filterBtn, filter === 'abnormal' && styles.filterActive]}
        >
          <Ionicons
            name="warning"
            size={12}
            color={filter === 'abnormal' ? '#FFF' : Colors.danger}
          />
          <Text style={[styles.filterText, filter === 'abnormal' && styles.filterTextActive]}>
            Alerts ({abnormalCount})
          </Text>
        </Pressable>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Ionicons name="heart" size={10} color={Colors.accent} />
          <Text style={styles.legendText}>HR</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="water" size={10} color="#4DA6FF" />
          <Text style={styles.legendText}>SpO2</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="nutrition" size={10} color={Colors.warning} />
          <Text style={styles.legendText}>Glucose</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="thermometer" size={10} color={Colors.success} />
          <Text style={styles.legendText}>Temp</Text>
        </View>
      </View>

      <FlatList
        data={filteredReadings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryItem reading={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 },
        ]}
        scrollEnabled={filteredReadings.length > 0}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {filter === 'abnormal' ? 'No abnormal readings found' : 'No readings yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
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
  headerSection: {
    marginBottom: 16,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: Colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
  listContent: {
    paddingTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
});
