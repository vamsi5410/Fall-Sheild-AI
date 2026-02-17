import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ECGChartProps {
  ecgValues: number[];
  currentValue: number;
}

const CHART_WIDTH = Dimensions.get('window').width - 64;
const CHART_HEIGHT = 160;
const PADDING_TOP = 15;
const PADDING_BOTTOM = 15;
const DRAWABLE_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const MAX_POINTS = 60;

export function ECGChart({ ecgValues, currentValue }: ECGChartProps) {
  const scanLineX = useSharedValue(0);

  useEffect(() => {
    scanLineX.value = withRepeat(
      withTiming(CHART_WIDTH, {
        duration: 3000,
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
    if (ecgValues.length === 0) return [0];
    return ecgValues.slice(-MAX_POINTS);
  }, [ecgValues]);

  const { points, minVal, maxVal } = useMemo(() => {
    const min = Math.min(...values) - 0.3;
    const max = Math.max(...values) + 0.3;
    const range = max - min || 1;

    const pts = values
      .map((val, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * CHART_WIDTH;
        const y = PADDING_TOP + DRAWABLE_HEIGHT - ((val - min) / range) * DRAWABLE_HEIGHT;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return { points: pts, minVal: min, maxVal: max };
  }, [values]);

  const lastPoint = useMemo(() => {
    if (values.length === 0) return { x: 0, y: CHART_HEIGHT / 2 };
    const range = maxVal - minVal || 1;
    const lastVal = values[values.length - 1];
    const x = ((values.length - 1) / Math.max(values.length - 1, 1)) * CHART_WIDTH;
    const y = PADDING_TOP + DRAWABLE_HEIGHT - ((lastVal - minVal) / range) * DRAWABLE_HEIGHT;
    return { x, y };
  }, [values, minVal, maxVal]);

  const gridLines = [0.25, 0.5, 0.75].map((pct) => PADDING_TOP + DRAWABLE_HEIGHT * pct);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.ecgDot} />
          <Text style={styles.title}>ECG Waveform</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.currentLabel}>Current</Text>
          <Text style={styles.currentVal}>{currentValue.toFixed(2)} mV</Text>
        </View>
      </View>
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {gridLines.map((y, i) => (
            <Line
              key={i}
              x1={0}
              y1={y}
              x2={CHART_WIDTH}
              y2={y}
              stroke={Colors.cardBorder}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}
          <Line
            x1={0}
            y1={PADDING_TOP + DRAWABLE_HEIGHT * 0.5}
            x2={CHART_WIDTH}
            y2={PADDING_TOP + DRAWABLE_HEIGHT * 0.5}
            stroke={Colors.accent + '30'}
            strokeWidth={1}
          />
          {values.length > 1 && (
            <Polyline
              points={points}
              fill="none"
              stroke={Colors.accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={4}
            fill={Colors.accent}
          />
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={7}
            fill={Colors.accent + '30'}
          />
        </Svg>
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{values.length} data points</Text>
        <Text style={styles.footerText}>Continuous monitoring</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ecgDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  currentLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentVal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.accent,
  },
  chartContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: CHART_HEIGHT,
    backgroundColor: Colors.accent + '40',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
