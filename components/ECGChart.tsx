import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

const CHART_WIDTH = Dimensions.get('window').width - 48;
const CHART_HEIGHT = 180;
const MAX_POINTS = 80;
const GRID_SPACING = 20;

interface ECGChartProps {
  ecgValues: number[];
  currentValue: number;
}

export function ECGChart({ ecgValues, currentValue }: ECGChartProps) {

  const scanLineX = useSharedValue(0);
  const ecgBuffer = useRef<number[]>([]);

  // 🔥 Real ECG Wave Generator
  const generateRealECG = () => {
    const t = Date.now() / 1000;

    return (
      Math.sin(t * 2) * 0.05 +    // baseline
      Math.sin(t * 5) * 0.1 +     // small wave
      Math.sin(t * 15) * 0.25 +   // P wave
      Math.sin(t * 30) * 0.8 +    // QRS spike
      Math.sin(t * 7) * 0.1 +     // T wave
      (Math.random() - 0.5) * 0.03
    );
  };

  // 🔥 Continuous ECG Update
  useEffect(() => {
    const interval = setInterval(() => {
      const newVal = generateRealECG();

      ecgBuffer.current.push(newVal);
      if (ecgBuffer.current.length > MAX_POINTS) {
        ecgBuffer.current.shift();
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // 🔥 Scan line animation
  useEffect(() => {
    scanLineX.value = 0;
    scanLineX.value = withRepeat(
      withTiming(CHART_WIDTH, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scanLineX.value }],
  }));

  const values = useMemo(() => {
    return ecgBuffer.current.length > 0 ? ecgBuffer.current : [0];
  }, []);

  const min = Math.min(...values) - 0.2;
  const max = Math.max(...values) + 0.2;
  const range = max - min || 1;

  const points = values
    .map((val, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((val - min) / range) * CHART_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');

  const last = values[values.length - 1] || 0;
  const lastX = ((values.length - 1) / Math.max(values.length - 1, 1)) * CHART_WIDTH;
  const lastY = CHART_HEIGHT - ((last - min) / range) * CHART_HEIGHT;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>ECG Monitor</Text>
        <Text style={styles.value}>{currentValue.toFixed(2)} mV</Text>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>

          <Rect width={CHART_WIDTH} height={CHART_HEIGHT} fill="#0A0F14" />

          {/* Grid */}
          {[...Array(20)].map((_, i) => (
            <Line
              key={`v${i}`}
              x1={i * GRID_SPACING}
              y1={0}
              x2={i * GRID_SPACING}
              y2={CHART_HEIGHT}
              stroke="#1A2A1A"
              strokeWidth={0.5}
            />
          ))}

          {[...Array(10)].map((_, i) => (
            <Line
              key={`h${i}`}
              x1={0}
              y1={i * GRID_SPACING}
              x2={CHART_WIDTH}
              y2={i * GRID_SPACING}
              stroke="#1A2A1A"
              strokeWidth={0.5}
            />
          ))}

          {/* ECG Line */}
          <Polyline
            points={points}
            fill="none"
            stroke="#00FF41"
            strokeWidth={2}
          />

          {/* Last point */}
          <Circle cx={lastX} cy={lastY} r={3} fill="#00FF41" />

        </Svg>

        <Animated.View style={[styles.scanLine, scanLineStyle]} />

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#00C853',
    fontWeight: '700',
  },
  chartWrapper: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    width: 2,
    height: CHART_HEIGHT,
    backgroundColor: '#00FF4140',
  },
});
