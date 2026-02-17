import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ThresholdSettings, loadThresholds, saveThresholds } from '@/lib/health-data';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<ThresholdSettings>({
    heartRateHigh: 120,
    spo2Low: 90,
    glucoseHigh: 200,
    temperatureHigh: 38,
    caretakerPhone: '',
    doctorName: '',
    patientName: 'Patient',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadThresholds().then(setSettings);
  }, []);

  const handleSave = useCallback(async () => {
    await saveThresholds(settings);
    setSaved(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const updateField = (field: keyof ThresholdSettings, value: string) => {
    const numFields = ['heartRateHigh', 'spo2Low', 'glucoseHigh', 'temperatureHigh'];
    if (numFields.includes(field)) {
      const num = parseFloat(value) || 0;
      setSettings((prev) => ({ ...prev, [field]: num }));
    } else {
      setSettings((prev) => ({ ...prev, [field]: value }));
    }
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

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
      <Text style={styles.headerTitle}>Settings</Text>
      <Text style={styles.headerSub}>Configure alert thresholds and contacts</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={16} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Patient Information</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Patient Name</Text>
          <TextInput
            style={styles.input}
            value={settings.patientName}
            onChangeText={(v) => updateField('patientName', v)}
            placeholder="Enter patient name"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Doctor Name</Text>
          <TextInput
            style={styles.input}
            value={settings.doctorName}
            onChangeText={(v) => updateField('doctorName', v)}
            placeholder="Enter doctor name"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          <Text style={styles.sectionTitle}>WhatsApp Alert</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Caretaker Phone Number</Text>
          <Text style={styles.hint}>Include country code (e.g., +1234567890)</Text>
          <TextInput
            style={styles.input}
            value={settings.caretakerPhone}
            onChangeText={(v) => updateField('caretakerPhone', v)}
            placeholder="+1234567890"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="tune-vertical" size={16} color={Colors.warning} />
          <Text style={styles.sectionTitle}>Alert Thresholds</Text>
        </View>

        <ThresholdInput
          icon="heart"
          iconFamily="ion"
          color={Colors.accent}
          label="Heart Rate (High)"
          value={settings.heartRateHigh.toString()}
          unit="BPM"
          onChange={(v) => updateField('heartRateHigh', v)}
          description="Alert when heart rate exceeds this value. Indicates Tachycardia / Arrhythmia risk."
        />
        <ThresholdInput
          icon="water"
          iconFamily="ion"
          color="#4DA6FF"
          label="SpO2 (Low)"
          value={settings.spo2Low.toString()}
          unit="%"
          onChange={(v) => updateField('spo2Low', v)}
          description="Alert when SpO2 drops below this value. Indicates Hypoxia / Respiratory distress."
        />
        <ThresholdInput
          icon="nutrition"
          iconFamily="ion"
          color={Colors.warning}
          label="Blood Glucose (High)"
          value={settings.glucoseHigh.toString()}
          unit="mg/dL"
          onChange={(v) => updateField('glucoseHigh', v)}
          description="Alert when glucose exceeds this value. Indicates Hyperglycemia / Diabetes risk."
        />
        <ThresholdInput
          icon="thermometer"
          iconFamily="ion"
          color="#FF6B35"
          label="Temperature (High)"
          value={settings.temperatureHigh.toString()}
          unit="C"
          onChange={(v) => updateField('temperatureHigh', v)}
          description="Alert when body temperature exceeds this value. Indicates Fever / Infection."
        />
      </View>

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveBtn,
          { opacity: pressed ? 0.8 : 1, backgroundColor: saved ? Colors.success : Colors.accent },
        ]}
      >
        <Ionicons name={saved ? 'checkmark-circle' : 'save'} size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save Settings'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function ThresholdInput({
  icon,
  iconFamily,
  color,
  label,
  value,
  unit,
  onChange,
  description,
}: {
  icon: string;
  iconFamily: 'ion' | 'mci';
  color: string;
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
  description: string;
}) {
  const IconComp = iconFamily === 'ion' ? Ionicons : MaterialCommunityIcons;
  return (
    <View style={styles.thresholdCard}>
      <View style={styles.thresholdHeader}>
        <View style={[styles.thresholdIcon, { backgroundColor: color + '20' }]}>
          <IconComp name={icon as any} size={16} color={color} />
        </View>
        <View style={styles.thresholdInfo}>
          <Text style={styles.thresholdLabel}>{label}</Text>
          <Text style={styles.thresholdDesc}>{description}</Text>
        </View>
      </View>
      <View style={styles.thresholdInputRow}>
        <TextInput
          style={[styles.thresholdInput, { borderColor: color + '40' }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
        <Text style={[styles.thresholdUnit, { color }]}>{unit}</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  thresholdCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
  },
  thresholdHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  thresholdIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdInfo: {
    flex: 1,
  },
  thresholdLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  thresholdDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  thresholdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thresholdInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    textAlign: 'center',
  },
  thresholdUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    width: 45,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  saveBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },
});
