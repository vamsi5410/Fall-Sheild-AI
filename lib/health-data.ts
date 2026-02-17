import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HealthReading {
  id: string;
  heartRate: number;
  spo2: number;
  glucose: number;
  temperature: number;
  ecg: number;
  timestamp: string;
  status: 'NORMAL' | 'ABNORMAL';
  risks: HealthRisk[];
}

export interface HealthRisk {
  type: RiskType;
  severity: 'warning' | 'critical';
  title: string;
  indicators: string[];
  icon: string;
}

export type RiskType = 'heart' | 'respiratory' | 'diabetes' | 'fever' | 'fall';

export interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
}

export interface ThresholdSettings {
  heartRateHigh: number;
  spo2Low: number;
  glucoseHigh: number;
  temperatureHigh: number;
  caretakerPhone: string;
  doctorName: string;
  patientName: string;
}

const DEFAULT_THRESHOLDS: ThresholdSettings = {
  heartRateHigh: 120,
  spo2Low: 90,
  glucoseHigh: 200,
  temperatureHigh: 38,
  caretakerPhone: '',
  doctorName: '',
  patientName: 'Patient',
};

const STORAGE_KEY = '@healthai_thresholds';

export async function loadThresholds(): Promise<ThresholdSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return { ...DEFAULT_THRESHOLDS, ...JSON.parse(data) };
    }
    return DEFAULT_THRESHOLDS;
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export async function saveThresholds(settings: ThresholdSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const CHANNEL_ID = '3257633';
const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json`;
const FEEDS_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=30`;

export function detectRisks(
  heartRate: number,
  spo2: number,
  glucose: number,
  temperature: number,
  ecg: number,
  thresholds: ThresholdSettings,
  prevReading?: HealthReading | null
): HealthRisk[] {
  const risks: HealthRisk[] = [];

  const ecgIrregular = Math.abs(ecg) > 1.5 || (prevReading && Math.abs(ecg - prevReading.ecg) > 1.0);

  if (heartRate > thresholds.heartRateHigh || ecgIrregular) {
    const indicators: string[] = [];
    if (heartRate > thresholds.heartRateHigh) indicators.push('Tachycardia');
    if (ecgIrregular) indicators.push('Arrhythmia');
    risks.push({
      type: 'heart',
      severity: heartRate > 150 ? 'critical' : 'warning',
      title: 'Heart Disease Risk',
      indicators,
      icon: 'heart-pulse',
    });
  }

  if (spo2 < thresholds.spo2Low) {
    const indicators: string[] = ['Hypoxia'];
    if (spo2 < 85) indicators.push('Respiratory Distress');
    risks.push({
      type: 'respiratory',
      severity: spo2 < 85 ? 'critical' : 'warning',
      title: 'Respiratory Issues',
      indicators,
      icon: 'lungs',
    });
  }

  if (glucose > thresholds.glucoseHigh) {
    const indicators: string[] = ['Hyperglycemia'];
    if (glucose > 300) indicators.push('Diabetes Emergency');
    else indicators.push('Diabetes Risk');
    risks.push({
      type: 'diabetes',
      severity: glucose > 300 ? 'critical' : 'warning',
      title: 'Diabetes Risk',
      indicators,
      icon: 'water',
    });
  }

  if (temperature > thresholds.temperatureHigh) {
    const indicators: string[] = ['Fever'];
    if (temperature > 39.5) indicators.push('High-grade Infection');
    else indicators.push('Possible Infection');
    risks.push({
      type: 'fever',
      severity: temperature > 39.5 ? 'critical' : 'warning',
      title: 'Infection / Fever',
      indicators,
      icon: 'thermometer-alert',
    });
  }

  if (prevReading) {
    const hrSpike = heartRate - prevReading.heartRate > 30;
    const spo2Drop = prevReading.spo2 - spo2 > 10;
    const ecgFlux = Math.abs(ecg - prevReading.ecg) > 1.5;
    if ((hrSpike && spo2Drop) || (hrSpike && ecgFlux) || (spo2Drop && ecgFlux)) {
      risks.push({
        type: 'fall',
        severity: 'critical',
        title: 'Fall Risk Detected',
        indicators: [
          ...(hrSpike ? ['Sudden HR Spike'] : []),
          ...(spo2Drop ? ['SpO2 Drop'] : []),
          ...(ecgFlux ? ['ECG Fluctuation'] : []),
        ],
        icon: 'alert-circle',
      });
    }
  }

  return risks;
}

export function evaluateStatus(risks: HealthRisk[]): 'NORMAL' | 'ABNORMAL' {
  return risks.length > 0 ? 'ABNORMAL' : 'NORMAL';
}

function parseFeed(
  feed: ThingSpeakFeed,
  thresholds: ThresholdSettings,
  prevReading?: HealthReading | null
): HealthReading {
  const heartRate = parseFloat(feed.field1 || '0') || 0;
  const spo2 = parseFloat(feed.field2 || '0') || 0;
  const glucose = parseFloat(feed.field3 || '0') || 0;
  const temperature = parseFloat(feed.field4 || '0') || 0;
  const ecg = parseFloat(feed.field5 || '0') || 0;
  const risks = detectRisks(heartRate, spo2, glucose, temperature, ecg, thresholds, prevReading);
  const status = evaluateStatus(risks);

  return {
    id: feed.entry_id.toString(),
    heartRate: Math.round(heartRate * 10) / 10,
    spo2: Math.round(spo2 * 10) / 10,
    glucose: Math.round(glucose * 10) / 10,
    temperature: Math.round(temperature * 10) / 10,
    ecg: Math.round(ecg * 100) / 100,
    timestamp: feed.created_at,
    status,
    risks,
  };
}

export async function fetchLatestReading(
  thresholds: ThresholdSettings,
  prevReading?: HealthReading | null
): Promise<HealthReading> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch health data');
  const feed: ThingSpeakFeed = await response.json();
  return parseFeed(feed, thresholds, prevReading);
}

export async function fetchRecentReadings(thresholds: ThresholdSettings): Promise<HealthReading[]> {
  const response = await fetch(FEEDS_URL);
  if (!response.ok) throw new Error('Failed to fetch history');
  const data = await response.json();
  const feeds: ThingSpeakFeed[] = data.feeds || [];
  const readings: HealthReading[] = [];
  for (let i = 0; i < feeds.length; i++) {
    const prev = i > 0 ? readings[i - 1] : null;
    readings.push(parseFeed(feeds[i], thresholds, prev));
  }
  return readings.reverse();
}

export function generateWhatsAppUrl(phoneNumber: string, reading: HealthReading): string {
  const riskLines = reading.risks
    .map((r) => `${r.title}: ${r.indicators.join(', ')} [${r.severity.toUpperCase()}]`)
    .join('\n');

  const message = encodeURIComponent(
    `HEALTH ALERT - ABNORMAL CONDITION DETECTED!\n\n` +
    `Patient Vitals:\n` +
    `Heart Rate: ${reading.heartRate} BPM\n` +
    `SpO2: ${reading.spo2}%\n` +
    `Glucose: ${reading.glucose} mg/dL\n` +
    `Temperature: ${reading.temperature} C\n` +
    `ECG: ${reading.ecg} mV\n\n` +
    `Risk Assessment:\n${riskLines}\n\n` +
    `Time: ${new Date(reading.timestamp).toLocaleString()}\n\n` +
    `Sent via HealthAI Monitor`
  );
  return `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
}

export function generateReportText(reading: HealthReading, settings: ThresholdSettings): string {
  const time = new Date(reading.timestamp).toLocaleString();
  const riskLines = reading.risks.length > 0
    ? reading.risks
        .map((r) => `  - ${r.title} (${r.severity}): ${r.indicators.join(', ')}`)
        .join('\n')
    : '  No abnormalities detected.';

  return (
    `HEALTH MONITORING REPORT\n` +
    `========================\n\n` +
    `Patient: ${settings.patientName}\n` +
    `Doctor: ${settings.doctorName || 'N/A'}\n` +
    `Date/Time: ${time}\n\n` +
    `VITAL SIGNS\n` +
    `-----------\n` +
    `Heart Rate: ${reading.heartRate} BPM\n` +
    `SpO2: ${reading.spo2}%\n` +
    `Blood Glucose: ${reading.glucose} mg/dL\n` +
    `Body Temperature: ${reading.temperature} C\n` +
    `ECG Signal: ${reading.ecg} mV\n\n` +
    `PATIENT STATUS: ${reading.status}\n\n` +
    `RISK ASSESSMENT\n` +
    `---------------\n` +
    `${riskLines}\n\n` +
    `THRESHOLD SETTINGS\n` +
    `------------------\n` +
    `Heart Rate Alert: > ${settings.heartRateHigh} BPM\n` +
    `SpO2 Alert: < ${settings.spo2Low}%\n` +
    `Glucose Alert: > ${settings.glucoseHigh} mg/dL\n` +
    `Temperature Alert: > ${settings.temperatureHigh} C\n\n` +
    `Generated by HealthAI Monitor`
  );
}
