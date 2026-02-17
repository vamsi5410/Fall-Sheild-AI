export interface HealthReading {
  id: string;
  heartRate: number;
  spo2: number;
  glucose: number;
  temperature: number;
  ecg: number;
  timestamp: string;
  status: 'NORMAL' | 'ABNORMAL';
}

export interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
}

const CHANNEL_ID = '3257633';
const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json`;
const FEEDS_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=20`;

export function evaluateStatus(heartRate: number, spo2: number, glucose: number): 'NORMAL' | 'ABNORMAL' {
  if (heartRate > 120 || spo2 < 85 || glucose > 200) {
    return 'ABNORMAL';
  }
  return 'NORMAL';
}

export function getAbnormalReasons(heartRate: number, spo2: number, glucose: number): string[] {
  const reasons: string[] = [];
  if (heartRate > 120) reasons.push(`High Heart Rate: ${heartRate} BPM`);
  if (spo2 < 85) reasons.push(`Low SpO2: ${spo2}%`);
  if (glucose > 200) reasons.push(`High Glucose: ${glucose} mg/dL`);
  return reasons;
}

function parseFeed(feed: ThingSpeakFeed): HealthReading {
  const heartRate = parseFloat(feed.field1 || '0') || 0;
  const spo2 = parseFloat(feed.field2 || '0') || 0;
  const glucose = parseFloat(feed.field3 || '0') || 0;
  const temperature = parseFloat(feed.field4 || '0') || 0;
  const ecg = parseFloat(feed.field5 || '0') || 0;
  const status = evaluateStatus(heartRate, spo2, glucose);

  return {
    id: feed.entry_id.toString(),
    heartRate: Math.round(heartRate * 10) / 10,
    spo2: Math.round(spo2 * 10) / 10,
    glucose: Math.round(glucose * 10) / 10,
    temperature: Math.round(temperature * 10) / 10,
    ecg: Math.round(ecg * 100) / 100,
    timestamp: feed.created_at,
    status,
  };
}

export async function fetchLatestReading(): Promise<HealthReading> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch health data');
  const feed: ThingSpeakFeed = await response.json();
  return parseFeed(feed);
}

export async function fetchRecentReadings(): Promise<HealthReading[]> {
  const response = await fetch(FEEDS_URL);
  if (!response.ok) throw new Error('Failed to fetch history');
  const data = await response.json();
  const feeds: ThingSpeakFeed[] = data.feeds || [];
  return feeds.map(parseFeed).reverse();
}

export function generateWhatsAppUrl(phoneNumber: string, reading: HealthReading): string {
  const reasons = getAbnormalReasons(reading.heartRate, reading.spo2, reading.glucose);
  const message = encodeURIComponent(
    `HEALTH ALERT - ABNORMAL CONDITION DETECTED!\n\n` +
    `Patient Vitals:\n` +
    `Heart Rate: ${reading.heartRate} BPM\n` +
    `SpO2: ${reading.spo2}%\n` +
    `Glucose: ${reading.glucose} mg/dL\n` +
    `Temperature: ${reading.temperature} F\n\n` +
    `Alerts:\n${reasons.join('\n')}\n\n` +
    `Time: ${new Date(reading.timestamp).toLocaleString()}`
  );
  return `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
}
