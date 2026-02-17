import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import {
  HealthReading,
  ThresholdSettings,
  fetchLatestReading,
  loadThresholds,
  generateReportText,
  generateWhatsAppUrl,
} from '@/lib/health-data';

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const [reading, setReading] = useState<HealthReading | null>(null);
  const [settings, setSettings] = useState<ThresholdSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const thresh = await loadThresholds();
      setSettings(thresh);
      const data = await fetchLatestReading(thresh);
      setReading(data);
    } catch (e) {
      console.log('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleShare = async () => {
    if (!reading || !settings) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const report = generateReportText(reading, settings);
    try {
      await Share.share({
        message: report,
        title: 'Health Report',
      });
    } catch {
      console.log('Share failed');
    }
  };

  const handleWhatsApp = async () => {
    if (!reading || !settings || !settings.caretakerPhone) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    const url = generateWhatsAppUrl(settings.caretakerPhone, reading);
    try {
      await Linking.openURL(url);
    } catch {
      console.log('Could not open WhatsApp');
    }
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  if (!reading || !settings) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.loadingText}>Unable to load data</Text>
        <Pressable onPress={loadData} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const isAbnormal = reading.status === 'ABNORMAL';

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
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Health Report</Text>
      <Text style={styles.headerSub}>Latest reading for doctor / caretaker</Text>

      <View style={styles.patientCard}>
        <View style={styles.patientRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={24} color={Colors.accent} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{settings.patientName}</Text>
            {settings.doctorName ? (
              <Text style={styles.doctorName}>Dr. {settings.doctorName}</Text>
            ) : null}
          </View>
          <View style={[styles.statusChip, isAbnormal ? styles.chipAbnormal : styles.chipNormal]}>
            <Text style={[styles.statusChipText, isAbnormal ? styles.chipTextAbnormal : styles.chipTextNormal]}>
              {reading.status}
            </Text>
          </View>
        </View>
        <Text style={styles.timeStamp}>
          {new Date(reading.timestamp).toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vital Signs</Text>
        <View style={styles.vitalsTable}>
          <VitalRow label="Heart Rate" value={`${reading.heartRate}`} unit="BPM" icon="heart" color={Colors.accent} isAlert={reading.heartRate > settings.heartRateHigh} />
          <VitalRow label="SpO2" value={`${reading.spo2}`} unit="%" icon="water" color="#4DA6FF" isAlert={reading.spo2 < settings.spo2Low} />
          <VitalRow label="Blood Glucose" value={`${reading.glucose}`} unit="mg/dL" icon="nutrition" color={Colors.warning} isAlert={reading.glucose > settings.glucoseHigh} />
          <VitalRow label="Temperature" value={`${reading.temperature}`} unit="C" icon="thermometer" color="#FF6B35" isAlert={reading.temperature > settings.temperatureHigh} />
          <VitalRow label="ECG Signal" value={`${reading.ecg}`} unit="mV" icon="pulse" color={Colors.accent} isAlert={false} />
        </View>
      </View>

      {reading.risks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          {reading.risks.map((risk, i) => (
            <View key={i} style={[styles.riskRow, risk.severity === 'critical' ? styles.riskCritical : styles.riskWarning]}>
              <View style={styles.riskLeft}>
                <MaterialCommunityIcons
                  name={risk.type === 'heart' ? 'heart-pulse' : risk.type === 'respiratory' ? 'lungs' : risk.type === 'fever' ? 'thermometer-alert' : 'alert-circle'}
                  size={18}
                  color={risk.severity === 'critical' ? Colors.danger : Colors.warning}
                />
                <View>
                  <Text style={styles.riskTitle}>{risk.title}</Text>
                  <Text style={styles.riskIndicators}>{risk.indicators.join(', ')}</Text>
                </View>
              </View>
              <View style={[styles.severityPill, risk.severity === 'critical' ? styles.pillCritical : styles.pillWarning]}>
                <Text style={[styles.severityPillText, risk.severity === 'critical' ? styles.pillTextCritical : styles.pillTextWarning]}>
                  {risk.severity.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Thresholds</Text>
        <View style={styles.thresholdTable}>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Heart Rate</Text>
            <Text style={styles.thresholdValue}>{`> ${settings.heartRateHigh} BPM`}</Text>
          </View>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>SpO2</Text>
            <Text style={styles.thresholdValue}>{`< ${settings.spo2Low}%`}</Text>
          </View>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Glucose</Text>
            <Text style={styles.thresholdValue}>{`> ${settings.glucoseHigh} mg/dL`}</Text>
          </View>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Temperature</Text>
            <Text style={styles.thresholdValue}>{`> ${settings.temperatureHigh} C`}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.actionBtn, styles.shareBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="share-outline" size={20} color="#FFF" />
          <Text style={styles.actionBtnText}>Share Report</Text>
        </Pressable>
        {settings.caretakerPhone.length > 0 && (
          <Pressable
            onPress={handleWhatsApp}
            style={({ pressed }) => [styles.actionBtn, styles.waBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>Send via WhatsApp</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function VitalRow({
  label,
  value,
  unit,
  icon,
  color,
  isAlert,
}: {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
  isAlert: boolean;
}) {
  return (
    <View style={[styles.vitalRow, isAlert && styles.vitalRowAlert]}>
      <View style={styles.vitalLeft}>
        <View style={[styles.vitalIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={14} color={color} />
        </View>
        <Text style={styles.vitalLabel}>{label}</Text>
      </View>
      <View style={styles.vitalRight}>
        <Text style={[styles.vitalValue, isAlert && { color: Colors.danger }]}>{value}</Text>
        <Text style={styles.vitalUnit}>{unit}</Text>
        {isAlert && <Ionicons name="warning" size={12} color={Colors.danger} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
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
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  retryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFF',
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
    marginBottom: 20,
  },
  patientCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  doctorName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipNormal: {
    backgroundColor: Colors.success + '20',
  },
  chipAbnormal: {
    backgroundColor: Colors.danger + '20',
  },
  statusChipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  chipTextNormal: {
    color: Colors.success,
  },
  chipTextAbnormal: {
    color: Colors.danger,
  },
  timeStamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 10,
  },
  vitalsTable: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  vitalRowAlert: {
    backgroundColor: Colors.danger + '08',
  },
  vitalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vitalIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  vitalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vitalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  vitalUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  riskCritical: {
    backgroundColor: Colors.danger + '10',
    borderColor: Colors.danger + '30',
  },
  riskWarning: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '30',
  },
  riskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  riskTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  riskIndicators: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  pillCritical: {
    backgroundColor: Colors.danger + '30',
  },
  pillWarning: {
    backgroundColor: Colors.warning + '30',
  },
  severityPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  pillTextCritical: {
    color: Colors.danger,
  },
  pillTextWarning: {
    color: Colors.warning,
  },
  thresholdTable: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  thresholdLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  thresholdValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  shareBtn: {
    backgroundColor: Colors.accent,
  },
  waBtn: {
    backgroundColor: '#25D366',
  },
  actionBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },
});
